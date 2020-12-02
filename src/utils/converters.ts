import { WhereAction, Where, applyAliases } from '@via-profit-services/core';
import { ConvertOrderByToKnex, ConvertJsonToKnex, ConvertBetweenToKnex, ConvertWhereToKnex } from '@via-profit-services/knex';
import moment from 'moment-timezone';

import { DEFAULT_TIMEZONE } from '../constants';
/**
 * Convert GraphQL OrderBy array to Knex OrderBy array format
 */
export const convertOrderByToKnex: ConvertOrderByToKnex = (orderBy) => {
  const orderByArray = [...(orderBy || [])];

  return orderByArray.map(({ field, direction }) => ({
    column: field,
    order: direction,
  }))
};


export const convertJsonToKnex: ConvertJsonToKnex = (knex, json) => {
  const jsonString = `'${JSON.stringify(json)}'::jsonb`;

  return knex.raw(jsonString);
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
      whereArray.push([field, WhereAction.EQ, value]);
    });
  }

  [...(aliases
    ? applyAliases(whereArray, aliases)
    : whereArray),
  ].forEach(([field, action, value]) => {
    switch (true) {
      case action === WhereAction.IN:

        builder.whereIn(field, Array.isArray(value) ? value : [value] as Array<string | number>);
        break;

      case action === WhereAction.NOTIN:
        builder.whereNotIn(field, Array.isArray(value) ? value : [value] as Array<string | number>);
        break;

      case action === WhereAction.NULL:
        builder.whereNull(field);
        break;

      case action === WhereAction.NOTNULL:
        builder.whereNotNull(field);
        break;

      default:
        builder.where(field, action, value as string | number | boolean | null);
        break;
    }
  });


  return builder;
};

