import { Where, ServerError, WhereField } from '@via-profit-services/core';
import {
  ConvertOrderByToKnex,
  ConvertJsonToKnex,
  ConvertBetweenToKnex,
  ConvertWhereToKnex,
  ConvertSearchToKnex,
  ApplyAliases,
} from '@via-profit-services/knex';
import moment from 'moment-timezone';

import { DEFAULT_TIMEZONE } from '../constants';

export const applyAliases: ApplyAliases = (whereClause, aliases) => {
  const aliasesMap = new Map<string, string>();
  Object.entries(aliases).forEach(([tableName, field]) => {
    const fieldsArray = Array.isArray(field) ? field : [field];
    fieldsArray.forEach(fieldName => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  const newWhere = whereClause.map(data => {
    const [field, action, value] = data;
    const alias = aliasesMap.get(field) || aliasesMap.get('*');

    const whereField: WhereField = [
      alias && alias !== 'none' ? `${alias}.${field}` : field,
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
    fieldsArray.forEach(fieldName => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  return orderByArray.map(({ field, direction }) => {
    const alias = aliasesMap.get(field) || aliasesMap.get('*');

    return {
      column: alias && alias !== 'none' ? `${alias}.${field}` : field,
      order: direction,
    };
  });
};

export const convertJsonToKnex: ConvertJsonToKnex = (knex, data) => {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);

    return knex.raw('?::jsonb', [str]);
  } catch (err) {
    throw new ServerError(
      'Json field convertation failure. Check the «convertJsonToKnex» passed params',
      { err },
    );
  }
};

export const convertBetweenToKnex: ConvertBetweenToKnex = (builder, between, options) => {
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
    fieldsArray.forEach(fieldName => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  Object.entries(between).forEach(([field, betweenData]) => {
    const alias = aliasesMap.get(field) || aliasesMap.get('*');
    builder.whereBetween(alias && alias !== 'none' ? `${alias}.${field}` : field, [
      betweenData.start instanceof Date
        ? moment.tz(betweenData.start, timezone).format()
        : betweenData.start,
      betweenData.end instanceof Date
        ? moment.tz(betweenData.end, timezone).format()
        : betweenData.end,
    ]);
  });

  return builder;
};

export const convertWhereToKnex: ConvertWhereToKnex = (builder, whereClause, aliases) => {
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

  [...(aliases ? applyAliases(whereArray, aliases) : whereArray)].forEach(
    ([field, action, value]) => {
      switch (true) {
        case action === 'in':
          builder.whereIn(
            field,
            Array.isArray(value) ? value : ([value] as Array<string | number>),
          );
          break;

        case action === 'notIn':
          builder.whereNotIn(
            field,
            Array.isArray(value) ? value : ([value] as Array<string | number>),
          );
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
    },
  );

  return builder;
};

export const convertSearchToKnex: ConvertSearchToKnex = (builder, search, aliases, options) => {
  if (!search || !search.length) {
    return builder;
  }

  const splitWords =
    typeof options?.splitWords === 'undefined' ? false : Boolean(options?.splitWords);
  const strategy = typeof options?.strategy === 'undefined' ? 'from-start' : options.strategy;

  try {
    const searchFields: Record<string, string[]> = {};
    const aliasesMap = new Map<string, string>();

    // fill aliasesMap
    Object.entries(aliases || {}).forEach(([tableName, field]) => {
      const fieldsArray = Array.isArray(field) ? field : [field];
      fieldsArray.forEach(fieldName => {
        aliasesMap.set(fieldName, tableName);
      });
    });

    // Group search queries by field name
    search.forEach(({ field, query }) => {
      const data = searchFields[field] || [];
      const queries = splitWords ? query.trim().split(' ') : [query.trim()];
      searchFields[field] = data.concat(queries);
    });

    Object.entries(searchFields).forEach(([field, queries]) => {
      builder.andWhere(andWhereBuilder => {
        queries.forEach(query => {
          const alias = aliasesMap.get(field) || aliasesMap.get('*');
          const column = alias && alias !== 'none' ? `${alias}.${field}` : field;

          switch (strategy) {
            case 'to-end':
              andWhereBuilder.orWhereRaw('??::text ilike ?', [column, `%${query}`]);
              break;
            case 'explicit':
              andWhereBuilder.orWhereRaw('??::text ilike ?', [column, query]);
              break;
            case 'blurry':
              andWhereBuilder.orWhereRaw('??::text ilike ?', [column, `%${query}%`]);
              break;

            case 'from-start-strict':
              andWhereBuilder.orWhereRaw('??::text like ?', [column, `${query}%`]);
              break;

            case 'from-start':
            default:
              andWhereBuilder.orWhereRaw('??::text ilike ?', [column, `${query}%`]);
              break;
          }
        });

        return andWhereBuilder;
      });
    });

    return builder;
  } catch (err) {
    throw new ServerError(
      'Search field convertation failure. Check the «convertSearchToKnex» passed params',
      { err },
    );
  }
};
