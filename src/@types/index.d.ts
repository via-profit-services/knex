// Type definitions for @via-profit-services/knex
// Extends type definitions for @via-profit-services/core
// Project: git@github.com:via-profit-services/knex
// Definitions by: Via Profit <https://github.com/via-profit-services>
// Warning: This is not autogenerated definitions!

/// <reference types="node" />
declare module '@via-profit-services/core' {
  // import { Knex } from 'knex';
  import { Knex } from 'knex';

  interface Context {
    /**
     * Instance of knex.js
     * @see: https://github.com/knex/knex
     */
    knex: Knex;
  }

  interface CoreEmitter {
    on(event: 'knex-warning', callback: (message: string) => void): this;
    on(event: 'knex-error', callback: (message: string, errorData?: any) => void): this;
    on(event: 'knex-debug', callback: (message: string) => void): this;
    once(event: 'knex-warning', callback: (message: string) => void): this;
    once(event: 'knex-error', callback: (message: string, errorData?: any) => void): this;
    once(event: 'knex-debug', callback: (message: string) => void): this;
  }
}

declare module '@via-profit-services/knex' {
  import { Knex } from 'knex';
  import {
    OrderBy,
    DirectionRange,
    Between,
    Where,
    WhereValue,
    Middleware,
    OutputSearch,
    CoreEmitter,
  } from '@via-profit-services/core';

  /**
   * Table aliases map
   * Key - is a alias name \
   * Value - is a field alias name or array of names \
   * Use asterisk (\*) for default alias name. \
   * Use `none` as alias name to skip alias for specific column. \
   * For example:
   * ```js
   * {
   *   books: ['title', 'length'],
   *   none: ['titleGenerated'],
   *   info: ['*'],
   * }
   * ```
   */
  export type TableAliases = Record<string | 'none', string | string[]>;

  export type KnexGraphqlMiddlewareFactory = (config: Configuration) => Middleware;

  export interface Configuration {
    client: 'pg' | 'mysql' | 'sqlite3' | 'mysql2' | 'oracledb' | 'tedious';
    connection: Knex.StaticConnectionConfig;
    migrations?: Omit<Knex.MigratorConfig, 'database'>;
    seeds?: Omit<Knex.SeederConfig, 'variables'>;
    pool?: Omit<Knex.PoolConfig, 'name' | 'log' | 'refreshIdle' | 'returnToHead' | 'priorityRange'>;

    /**
     * When the specified query execution speed limits are reached,\
     * Knex provider will mark the corresponding query as normal, slow or panic
     */
    queryTimeLimit?: QueryTimeConfig;
  }

  export type QueryTimeConfig = {
    slow?: number;
    panic?: number;
  };

  export type ApplyAliases = (whereClause: Where, aliases: TableAliases) => Where;

  export interface KnexProviderProps {
    config: Configuration;
    emitter: CoreEmitter;
  }

  export type KnexMiddleware = (config: Configuration) => Middleware;
  export type KnexProvider = (props: KnexProviderProps) => Knex;

  export type OrderByKnex = {
    column: string;
    order: DirectionRange;
  }[];

  export type ConvertOrderByToKnex = (
    orderBy: OrderBy | undefined,
    aliases?: TableAliases,
  ) => OrderByKnex;
  export type ConvertJsonToKnex = <TRecord = unknown>(
    knex: Knex,
    data: unknown | string,
  ) => Knex.Raw<TRecord>;
  export type ConvertBetweenToKnex = (
    builder: Knex.QueryBuilder,
    between: Between | undefined,
    options?: {
      aliases?: TableAliases;
    },
  ) => Knex.QueryBuilder<any, any>;
  export type ConvertWhereToKnex = (
    builder: Knex.QueryBuilder,
    whereClause: { [key: string]: WhereValue } | Where,
    aliases?: TableAliases,
  ) => Knex.QueryBuilder<any, any>;

  export type ConvertSearchToKnex = (
    builder: Knex.QueryBuilder,
    search: OutputSearch | false | undefined | null,
    aliases?: TableAliases,
    options?: {
      strategy?: 'from-start' | 'to-end' | 'blurry' | 'explicit';
      splitWords?: boolean;
    },
  ) => Knex.QueryBuilder<any, any>;

  export type ExtractTotalCountPropOfNode = <T extends { totalCount: number }>(
    nodes: T[],
  ) => {
    nodes: Array<Omit<T, 'totalCount'>>;
    totalCount: number;
  };

  export type Times = Record<
    string,
    {
      startTime: number;
    }
  >;

  export type KnexQuery = {
    __knexQueryUid: string;
    sql: string;
    bindings: any;
  };

  export type Cache = {
    instance: Knex;
  };

  /**
   * Convert Order array to Knex Order by format\
   * Example:
   * ```ts
   * const orderBy = [{
   *   field: 'name',
   *   direction: 'asc',
   * }];
   *
   * await knex
   *   .select(['*'])
   *   .from('books')
   *   .orderBy(convertOrderByToKnex(orderBy)); // <-- [{ column: 'name', order: 'asc' }]
   *
   * ```
   */
  export const convertOrderByToKnex: ConvertOrderByToKnex;

  /**
   * Convert object or JSON string to Knex Raw
   */
  export const convertJsonToKnex: ConvertJsonToKnex;

  /**
   * Convert Between data to knex builder data\
   * Example:
   * ```ts
   * const between = {
   *   pages: {
   *     start: 300,
   *     end: 800,
   *   }
   * };
   *
   * await knex
   *   .select(['*'])
   *   .from('books')
   *   .where((builder) => convertBetweenToKnex(builder, between));
   *
   * ```
   * In third argument you can passed options:
   *  - **aliases** `TableAliases`. See `ApplyAliases`.
   */
  export const convertBetweenToKnex: ConvertBetweenToKnex;

  /**
   * Convert Where clause to knex builder\
   * Example:
   * ```ts
   * const where = [
   *   ['year', '=', 1992],
   *   ['pages', '>', 30],
   * ];
   *
   * await knex
   *   .select(['*'])
   *   .from('books')
   *   .where((builder) => convertWhereToKnex(builder, where));
   *
   * ```
   */
  export const convertWhereToKnex: ConvertWhereToKnex;

  /**
   * Convert `OutputSearch` to knex builder\
   * Example:
   * ```ts
   * const search = [{
   *   field: 'title',
   *   query: 'kitchen',
   * }];
   *
   * await knex
   *   .select(['*'])
   *   .from('books')
   *   .where((builder) => convertSearchToKnex(builder, search));
   *
   * ```
   */
  export const convertSearchToKnex: ConvertSearchToKnex;

  /**
   * Apply aliases map to where clause array
   *
   * ```ts
   * const where = [
   *   ['year', '=', 1992],
   *   ['pages', '>', 30],
   *   ['author', 'is not null'],
   * ];
   *
   * const aliases = {
   *   books: ['year', 'pages'],
   *   author: ['author'],
   * }
   * const where = applyAliases();
   * ```
   *
   * You can use asterisk (`*`) for default alias name:
   *
   * ```ts
   * const where = [
   *   ['year', '=', 1992],
   *   ['pages', '>', 30],
   *   ['author', 'is not null'],
   * ];
   *
   * const aliases = {
   *   books: [*],
   *   author: ['author'],
   * }
   * const where = applyAliases();
   * ```
   */
  export const applyAliases: ApplyAliases;

  /**
   * Extract `totalCount` property from array of Nodes\
   * Convert this:
   * ```js
   * [
   *  {id: '1', createdAt: 'XXX', updatedAt: 'XXX', totalCount: 2 },
   *  {id: '2', createdAt: 'XXX', updatedAt: 'XXX', totalCount: 2 },
   * ]
   * ```
   * To:
   * ```js
   * {
   *   totalCount: 2,
   *   nodes: [
   *      { id: '1', createdAt: 'XXX', updatedAt: 'XXX' },
   *      { id: '2', createdAt: 'XXX', updatedAt: 'XXX' },
   *   ],
   * }
   * ```
   */
  export const extractTotalCountPropOfNode: ExtractTotalCountPropOfNode;

  export const DATABASE_CHARSET: 'UTF8';
  export const DEFAULT_TIMEZONE: 'UTC';

  export const factory: KnexGraphqlMiddlewareFactory;
}
