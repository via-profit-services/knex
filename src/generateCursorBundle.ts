import {
  IDirectionRange, TOrderBy, TWhereAction, TTableAliases, TWhere, applyAliases, TBetween,
} from '@via-profit-services/core';
import Knex from 'knex';
import moment from 'moment-timezone';

/**
 * Convert GraphQL OrderBy array to Knex OrderBy array format
 * @param { TOrderBy } orderBy Array of objects econtains { field: "", direction: "" }
 */
export const convertOrderByToKnex = (orderBy: TOrderBy | undefined):
  TOrderByKnex => [...(orderBy || [])].map(({ field, direction }) => ({
  column: field,
  order: direction,
}));


// eslint-disable-next-line arrow-body-style
export const convertJsonToKnex = <TRecord = any>(knex: Knex, json: any | Array<any>) => {
  return knex.raw<TRecord>(`'${JSON.stringify(json)}'::jsonb`);
};


export const convertBetweenToKnex = (
  /**
   * Put your Knex builder \
   * For example: `knex('table').where((builder) => convertBetweenToKnex(builder, between))`
   */
  builder: Knex.QueryBuilder,
  between: TBetween | undefined,
  options?: {
    aliases?: TTableAliases;
    timezone: string;
  }
  ,
) => {
  const { aliases, timezone } = options || {
    aliases: {},
    timezone: 'UTC',
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


export const convertWhereToKnex = (
  /**
   * Put your Knex builder \
   * For example: `knex('table').where((builder) => convertWhereToKnex(builder, where))`
   */
  builder: Knex.QueryBuilder,

  /**
   * Just `TWhere` array
   */
  whereClause: {
      [key: string]: string | number | boolean | null;
    } | TWhere,
  aliases?: TTableAliases,
) => {
  if (typeof whereClause === 'undefined') {
    return builder;
  }

  const whereArray: TWhere = [];
  // if is an array
  if (Array.isArray(whereClause)) {
    whereClause.forEach(([field, action, value]) => {
      whereArray.push([field, action, value]);
    });
  }

  if (!Array.isArray(whereClause)) {
    Object.entries(whereClause).forEach(([field, value]) => {
      whereArray.push([field, TWhereAction.EQ, value]);
    });
  }

  [...(aliases
    ? applyAliases(whereArray, aliases)
    : whereArray),
  ].forEach(([field, action, value]) => {
    switch (true) {
      case action === TWhereAction.IN:

        builder.whereIn(field, Array.isArray(value) ? value : [value] as Array<string | number>);
        break;

      case action === TWhereAction.NOTIN:
        builder.whereNotIn(field, Array.isArray(value) ? value : [value] as Array<string | number>);
        break;

      case action === TWhereAction.NULL:
        builder.whereNull(field);
        break;

      case action === TWhereAction.NOTNULL:
        builder.whereNotNull(field);
        break;

      default:
        builder.where(field, action, value as string | number | boolean | null);
        break;
    }
  });


  return builder;
};

export type TOrderByKnex = Array<{
  column: string;
  order: IDirectionRange;
}>;

