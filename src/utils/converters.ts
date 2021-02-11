import { Where, ServerError, WhereField } from '@via-profit-services/core';
import {
  ConvertOrderByToKnex, ConvertJsonToKnex, ConvertBetweenToKnex,
  ConvertWhereToKnex, ConvertSearchToKnex, ApplyAliases,
} from '@via-profit-services/knex';
import moment from 'moment-timezone';

import { DEFAULT_TIMEZONE } from '../constants';

export const applyAliases: ApplyAliases = (whereClause, aliases) => {
  const aliasesMap = new Map<string, string>();
  Object.entries(aliases).forEach(([tableName, field]) => {
    const fieldsArray = Array.isArray(field) ? field : [field];
    fieldsArray.forEach((fieldName) => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  const newWhere = whereClause.map((data) => {
    const [field, action, value] = data;
    const alias = aliasesMap.get(field) || aliasesMap.get('*');

    const whereField: WhereField = [
      alias ? `${alias}.${field}` : field,
      action,
      value,
    ];

    return whereField;
  });

  return newWhere;
};


/**
 * Convert GraphQL OrderBy array to Knex OrderBy array format
 */
export const convertOrderByToKnex: ConvertOrderByToKnex = (orderBy, aliases) => {
  const orderByArray = [...(orderBy || [])];

  const aliasesMap = new Map<string, string>();
  Object.entries(aliases || {}).forEach(([tableName, field]) => {
    const fieldsArray = Array.isArray(field) ? field : [field];
    fieldsArray.forEach((fieldName) => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  return orderByArray.map(({ field, direction }) => {
    const alias = aliasesMap.get(field) || aliasesMap.get('*');

    return {
      column: alias ? `${alias}.${field}` : field,
      order: direction,
    }
  })
};


export const convertJsonToKnex: ConvertJsonToKnex = (knex, data) => {
  try {
    const jsonString = typeof data === 'string'
      ? `'${data}'::jsonb`
      : `'${JSON.stringify(data)}'::jsonb`;

    return knex.raw(jsonString);
  } catch (err) {
    throw new ServerError(
      'Json field convertation failure. Check the «convertJsonToKnex» passed params',
      { err },
    )
  }
};


export const convertBetweenToKnex: ConvertBetweenToKnex = ( builder, between, options) => {
  const { aliases, timezone } = options || {
    aliases: {},
    timezone: DEFAULT_TIMEZONE,
  };

  if (typeof between === 'undefined') {
    return builder;
  }

  const aliasesMap = new Map<string, string>();
  Object.entries(aliases || {}).forEach(([tableName, field]) => {
    const fieldsArray = Array.isArray(field) ? field : [field];
    fieldsArray.forEach((fieldName) => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  Object.entries(between).forEach(([field, betweenData]) => {
    const alias = aliasesMap.get(field) || aliasesMap.get('*');
    builder.whereBetween(
      alias ? `${alias}.${field}` : field,
      [
        betweenData.start instanceof Date
          ? moment.tz(betweenData.start, timezone).format()
          : betweenData.start,
        betweenData.end instanceof Date
          ? moment.tz(betweenData.end, timezone).format()
          : betweenData.end,
      ],
    );
  });

  return builder;
};


export const convertWhereToKnex: ConvertWhereToKnex = ( builder, whereClause, aliases ) => {
  if (typeof whereClause === 'undefined') {
    return builder;
  }

  const whereArray: Where = [];
  // if is an array
  if (Array.isArray(whereClause)) {
    whereClause.forEach(([field, action, value]) => {
      whereArray.push([field, action, value]);
    });
  }

  if (!Array.isArray(whereClause)) {
    Object.entries(whereClause).forEach(([field, value]) => {
      whereArray.push([field, '=', value]);
    });
  }

  [...(aliases
    ? applyAliases(whereArray, aliases)
    : whereArray),
  ].forEach(([field, action, value]) => {
    switch (true) {
      case action === 'in':

        builder.whereIn(field, Array.isArray(value) ? value : [value] as Array<string | number>);
        break;

      case action === 'notIn':
        builder.whereNotIn(field, Array.isArray(value) ? value : [value] as Array<string | number>);
        break;

      case action === 'is null':
        builder.whereNull(field);
        break;

      case action === 'is not null':
        builder.whereNotNull(field);
        break;

      default:
        builder.where(field, action, value as string | number | boolean | null);
        break;
    }
  });


  return builder;
};

export const convertSearchToKnex: ConvertSearchToKnex = (builder, search) => {
  if (search) {
    try {
      search.forEach(({ field, query }) => {
        query.split(' ').map((subquery) =>
          builder.orWhereRaw(`"${field}"::text ilike '%${subquery}%'`),
        );
      });
    } catch (err) {
      throw new ServerError(
        'Search field convertation failure. Check the «convertSearchToKnex» passed params',
        { err });
    }
  }

  return builder;
}