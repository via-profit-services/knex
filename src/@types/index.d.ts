// Type definitions for @via-profit-services/knex
// Extends type definitions for @via-profit-services/core
// Project: git@github.com:via-profit-services/knex
// Definitions by: Via Profit <https://github.com/via-profit-services>
// Warning: This is not autogenerated definitions!

/// <reference types="node" />
declare module '@via-profit-services/core' {
  import Knex from 'knex';

  interface Context {

    /**
     * Instance of knex.js
     * @see: https://github.com/knex/knex
     */
    knex: Knex;
  }

  interface LoggersCollection {
    /**
     * Database logger \
     * \
     * Transports:
     *  - `debug` - File transport
     *  - `error` - Console transport
     */
    sql: Logger;
  }
}

declare module '@via-profit-services/knex' {
  import type Knex from 'knex';
  import {
    OrderBy, DirectionRange, Between,
    TableAliases, Where, WhereValue,
    Logger, Middleware, OutputSearch,
  } from '@via-profit-services/core';

  export type KnexGraphqlMiddlewareFactory = (config: Configuration) => Middleware;


  export interface Configuration {

    logDir: string;

    /**
     * PostgreSQL connection config
     */
    connection: Knex.PgConnectionConfig;

    /**
     * Database server timezone\
     * \
     * Default: `UTC`
     */
    timezone?: string;

    /**
     * **Local** server timezone\
     * Used for convert `timestamp` and `timestamptz` entities to local `Date`\
     * If `enablePgTypes` is false then this property not used\
     * \
     * Default: `UTC`
     */
    localTimezone?: string;

    /**
     * Used for convert `timestamp` and `timestamptz` entities to local `Date`\
     * This option use `localTimezone` property\
     * \
     * Default: `true`
     */
    enablePgTypes?: boolean;
    migrations?: Knex.MigratorConfig;
    seeds?: Knex.SeederConfig;
    pool?: Knex.PoolConfig;
  }

  export interface KnexProviderProps {
    config: Configuration;
    logger: Logger;
  }

  export type KnexMiddleware = (config: Configuration) => Middleware;
  export type KnexProvider = (props: KnexProviderProps) => Knex;

  export type OrderByKnex = {
    column: string;
    order: DirectionRange;
  }[];

  export type ConvertOrderByToKnex = (orderBy: OrderBy | undefined) => OrderByKnex;
  export type ConvertJsonToKnex = <TRecord = any>(knex: Knex, json: any | any[]) => Knex.Raw<TRecord>;
  export type ConvertBetweenToKnex = (
    builder: Knex.QueryBuilder,
    between: Between | undefined,
    options?: {
      aliases?: TableAliases;
      timezone: string;
    }
  ) => Knex.QueryBuilder<any, any>;
  export type ConvertWhereToKnex = (
    builder: Knex.QueryBuilder,
    whereClause: {[key: string]: WhereValue} | Where,
    aliases?: TableAliases,
  ) => Knex.QueryBuilder<any, any>;

  export type ConvertSearchToKnex = (
    builder: Knex.QueryBuilder,
    search: OutputSearch | false | undefined | null,
  ) => Knex.QueryBuilder<any, any>;


  export type ExtractTotalCountPropOfNode = <T extends {totalCount: number }>(
    nodes: T[],
  ) => {
    nodes: Array<Omit<T, 'totalCount'>>;
    totalCount: number;
  }

  export const convertOrderByToKnex: ConvertOrderByToKnex;
  export const convertJsonToKnex: ConvertJsonToKnex;
  export const convertBetweenToKnex: ConvertBetweenToKnex;
  export const convertWhereToKnex: ConvertWhereToKnex;
  export const convertSearchToKnex: ConvertSearchToKnex;
  export const extractTotalCountPropOfNode: ExtractTotalCountPropOfNode;
  export const DATABASE_CHARSET: string;
  export const DATABASE_CLIENT: string;
  export const DEFAULT_TIMEZONE: string;

  export const factory: KnexGraphqlMiddlewareFactory;

}
