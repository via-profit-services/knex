import { ServerError } from '@via-profit-services/core';
import type { KnexProvider, QueryTimeConfig, Times, Cache, KnexQuery } from '@via-profit-services/knex';

import type { Knex } from 'knex';
import knex from 'knex';
import moment from 'moment-timezone';
import { performance } from 'perf_hooks';
import { types } from 'pg';

import {
  DATABASE_CHARSET, DATABASE_CLIENT, DEFAULT_TIMEZONE, ENABLE_PG_TYPES,
  QUERY_TIME_LIMIT_PANIC, QUERY_TIME_LIMIT_SLOW,
} from './constants';


const cache: Cache = {
  instance: null,
}

const knexProvider: KnexProvider = (props) => {

  if (cache.instance) {
    return cache.instance;
  }

  const { config, logger } = props;
  const {
    connection, timezone, localTimezone, pool, enablePgTypes, queryTimeLimit,
  } = config;
  const times: Times = {};
  const usePgTypes = typeof enablePgTypes === 'undefined' ? ENABLE_PG_TYPES : enablePgTypes;

  if (usePgTypes) {
    // Timestamp

    try {
      types.setTypeParser(
        types.builtins.TIMESTAMP, 'text',
        (value) => moment.tz(value, localTimezone || DEFAULT_TIMEZONE).toDate(),
      );

      // timestamptz
      types.setTypeParser(
        types.builtins.TIMESTAMPTZ, 'text',
        (value) => moment.tz(value, localTimezone || DEFAULT_TIMEZONE).toDate(),
      );

      // Numeric to float
      types.setTypeParser(types.builtins.NUMERIC, parseFloat);

      logger.debug('PG-TYPES are enabled');
    } catch (err) {
      throw new ServerError('Failed to applying PG-TYPES', { err });
    }
  }

  const knexPool: Knex.PoolConfig = {
    ...pool,
    afterCreate: pool?.afterCreate ? pool.afterCreate : (conn: any, done: any) => {
      conn.query(
        `
          set timezone = '${timezone || DEFAULT_TIMEZONE}';
          set client_encoding = ${DATABASE_CHARSET};
        `,
        (err: any) => {
          if (err) {
            logger.debug('Connection error', { err });
          } else {

            logger.debug(`Database connection is OK. timezone=${timezone || DEFAULT_TIMEZONE}. client_encoding=${DATABASE_CHARSET}`);
          }

          done(err, conn);
        },
      );
    },
  };

  const queryTimeConfig: QueryTimeConfig = {
    slow: QUERY_TIME_LIMIT_SLOW,
    panic: QUERY_TIME_LIMIT_PANIC,
    ...queryTimeLimit,
  };


  const knexOnQueryListener = (query: KnexQuery) => {
    const { __knexQueryUid } = query;

    times[__knexQueryUid] = {
      startTime: performance.now(),
    };
  }

  const knexOnQueryResponseListener = (
    response: any,
    query: KnexQuery,
    builder: Knex.QueryBuilder,
  ) => {
    const { __knexQueryUid } = query;
    const queryTimeMs = performance.now() - (times[__knexQueryUid]?.startTime || 0);
    let queryTimeLabel = '[normal]';

    if (queryTimeMs > queryTimeConfig.panic) {
      queryTimeLabel = '[panic] ';
    }

    if (queryTimeMs > queryTimeConfig.slow) {
      queryTimeLabel = '[slow]  ';
    }

    if (process.env.NODE_ENV === 'development' && queryTimeLabel !== '[normal]') {
      // eslint-disable-next-line no-console
      console.log(
        '\x1b[33m%s\x1b[0m \x1b[34m%s\x1b[0m \x1b[90m%s\x1b[0m',
        'SQL slow query at',
        `${queryTimeMs.toFixed(3)} ms`,
        `${builder.toString().substr(0, 70)}...`,
      )
    }

    logger.debug(`${queryTimeLabel} ${queryTimeMs.toFixed(3)} ms: ${builder.toString()}`);
  }

  const knexOnQueryErrorListener = (err: Error, query: KnexQuery) => {
    logger.error(query.sql, { err, bindings: query.bindings });
  }

  const checkConnection = async (knexHandle: Knex): Promise<void> => {
    try {
      await knexHandle.raw('select 1+1 as ping')
    } catch (err) {
      logger.error(err.name, err);
      throw new ServerError(
        'Checking the database connection. Connection failure. Please check your database connection details. Make sure that the database is working properly.',
      );
    }
  }

  try {
    cache.instance = knex({
      client: DATABASE_CLIENT,
      connection,
      pool: knexPool,
    });

    cache.instance.on('query', knexOnQueryListener);
    cache.instance.on('query-response', knexOnQueryResponseListener);
    cache.instance.on('query-error', knexOnQueryErrorListener);

    checkConnection(cache.instance);

    return cache.instance;
  } catch (err) {
    throw new ServerError('Knex initialization failure', { err });
  }
}

export default knexProvider;
