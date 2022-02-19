import { Where, WhereField, OrderBy, OutputSearch, Between } from '@via-profit-services/core';
import type {
  ConvertOrderByToKnex,
  ConvertJsonToKnex,
  ConvertBetweenToKnex,
  ConvertWhereToKnex,
  ConvertSearchToKnex,
  TableAliases,
  ApplyAliases,
} from '@via-profit-services/knex';

import { DEFAULT_TIMEZONE } from '../constants';

const isWhereClause = (data: unknown): data is Where =>
  Array.isArray(data) && data.some(entry => Array.isArray(entry) && entry.length === 3);

const isOrderBy = (data: unknown): data is OrderBy =>
  Array.isArray(data) &&
  data.some(entry => Object.keys(entry).length === 2 && 'field' in entry && 'direction' in entry);

const isBetween = (data: unknown): data is Between =>
  typeof data === 'object' &&
  Object.values(data).some(
    entry => Object.keys(entry).length === 2 && 'start' in entry && 'end' in entry,
  );

const isSearch = (data: unknown): data is OutputSearch =>
  Array.isArray(data) &&
  data.some(entry => Object.keys(entry).length === 2 && 'field' in entry && 'query' in entry);

export const applyAliases: ApplyAliases = <
  T extends string | Where | OrderBy | Between | OutputSearch,
>(
  source: T,
  aliases?: TableAliases,
): T => {
  if (typeof aliases === 'undefined') {
    return source;
  }

  const aliasesMap = new Map<string, string>();
  Object.entries(aliases).forEach(([tableName, field]) => {
    const fieldsArray = Array.isArray(field) ? field : [field];
    fieldsArray.forEach(fieldName => {
      aliasesMap.set(fieldName, tableName);
    });
  });

  // If is a string
  if (typeof source === 'string') {
    const alias = aliasesMap.get(source) || aliasesMap.get('*');
    const field = alias && alias !== 'none' ? `${alias}.${source}` : source;

    return field as any;
  }

  // If is an array like Where clause ([['field', '=', 123]])
  if (isWhereClause(source)) {
    const whereClause = source.map(data => {
      // check to segments contained
      if (data.length === 3) {
        const [field, action, value] = data as WhereField;
        const whereField: WhereField = [applyAliases(field, aliases), action, value];

        return whereField;
      }

      return data;
    });

    return whereClause as T & Where;
  }

  // If is an array like OrderBy ([{field: 'field', direction: 'asc'}])
  if (isOrderBy(source)) {
    const orderBy = source.map(({ field, direction }) => ({
      field: applyAliases(field, aliases),
      direction: direction,
    }));

    return orderBy as T & OrderBy;
  }

  if (isBetween(source)) {
    const between: Between = {};
    Object.entries(source).forEach(([field, value]) => {
      const newField = applyAliases(field, aliases);

      between[newField] = value;
    });

    return between as T & Between;
  }

  if (isSearch(source)) {
    const search = source.map(({ field, query }) => ({
      query,
      field: applyAliases(field, aliases),
    }));

    return search as T & OutputSearch;
  }

  return source;
};

/**
 * Convert GraphQL OrderBy array to Knex OrderBy array format
 */
export const convertOrderByToKnex: ConvertOrderByToKnex = (orderBy, aliases) => {
  const orderByArray = [...(orderBy || [])];

  return orderByArray.map(({ field, direction }) => ({
    column: applyAliases(field, aliases),
    order: direction,
  }));
};

export const convertJsonToKnex: ConvertJsonToKnex = (knex, data) => {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);

    return knex.raw('?::jsonb', [str]);
  } catch (err) {
    throw new Error('Json field convertation failure. Check the «convertJsonToKnex» passed params');
  }
};

export const convertBetweenToKnex: ConvertBetweenToKnex = (builder, between, options) => {
  const { aliases } = options || {
    aliases: {},
    timezone: DEFAULT_TIMEZONE,
  };

  if (typeof between === 'undefined') {
    return builder;
  }

  Object.entries(between).forEach(([field, betweenData]) => {
    builder.whereBetween(applyAliases(field, aliases), [
      betweenData.start instanceof Date
        ? new Date(betweenData.start).toUTCString()
        : betweenData.start,
      betweenData.end instanceof Date ? new Date(betweenData.end).toUTCString() : betweenData.end,
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

    // Group search queries by field name
    search.forEach(({ field, query }) => {
      const data = searchFields[field] || [];
      const queries = splitWords ? query.trim().split(' ') : [query.trim()];
      searchFields[field] = data.concat(queries);
    });

    Object.entries(searchFields).forEach(([field, queries]) => {
      builder.andWhere(andWhereBuilder => {
        queries.forEach(query => {
          const column = applyAliases(field, aliases);

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
    throw new Error(
      'Search field convertation failure. Check the «convertSearchToKnex» passed params',
    );
  }
};
