import type {
  KnexProvider,
  QueryTimeConfig,
  Times,
  Cache,
  KnexQuery,
} from '@via-profit-services/knex';

import type { Knex } from 'knex';
import knex from 'knex';
import { performance } from 'perf_hooks';
// import { types } from 'pg';

import {
  DATABASE_CHARSET,
  DEFAULT_TIMEZONE,
  QUERY_TIME_LIMIT_PANIC,
  QUERY_TIME_LIMIT_SLOW,
  DEFAULT_POOL_SETTINGS,
} from './constants';

const cache: Cache = {
  instance: null,
};

const knexProvider: KnexProvider = props => {
  if (cache.instance) {
    return cache.instance;
  }

  const { config, emitter } = props;
  const { connection, client, pool, queryTimeLimit } = config;
  const times: Times = {};

  // types.setTypeParser(
  //   types.builtins.TIMESTAMP,
  //   'text',
  //   value => new Date(value).toUTCString(),
  // );

  // timestamptz
  // types.setTypeParser(
  //   types.builtins.TIMESTAMPTZ,
  //   'text',
  //   value => new Date(value).toUTCString(),
  // );

  // Numeric to float
  // types.setTypeParser(types.builtins.NUMERIC, parseFloat);

  const knexPool: Knex.PoolConfig = {
    ...DEFAULT_POOL_SETTINGS,
    ...pool,
    log: (message, logLevel) => {
      if (logLevel === 'warn') {
        emitter.emit('knex-warning', message);
      }

      if (logLevel === 'error') {
        emitter.emit('knex-error', message);
      }

      if (logLevel === 'error') {
        emitter.emit('knex-debug', message);
      }
    },
    afterCreate: pool?.afterCreate
      ? pool.afterCreate
      : (conn: any, done: any) => {
          conn.query(
            `
          set timezone = '${DEFAULT_TIMEZONE}';
          set client_encoding = ${DATABASE_CHARSET};
        `,
            (err: any) => {
              if (err) {
                emitter.emit('knex-error', 'Connection error.', { err });
              } else {
                emitter.emit(
                  'knex-debug',
                  `Database connection is OK. timezone=${DEFAULT_TIMEZONE}. client_encoding=${DATABASE_CHARSET}`,
                );
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
  };

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
      );
    }

    emitter.emit(
      'knex-debug',
      `${queryTimeLabel} ${queryTimeMs.toFixed(3)} ms: ${builder.toString()}`,
    );
  };

  const knexOnQueryErrorListener = (err: Error, query: KnexQuery) => {
    emitter.emit('knex-error', err, {
      query,
    });
  };

  const checkConnection = async (knexHandle: Knex): Promise<void> => {
    try {
      await knexHandle.raw('select 1+1 as ping');
    } catch (err) {
      emitter.emit(
        'knex-error',
        'Connection failure. Please check your database connection details. Make sure that the database is working properly.',
      );
    }
  };

  try {
    cache.instance = knex({
      client,
      connection,
      pool: knexPool,
    });

    cache.instance.on('query', knexOnQueryListener);
    cache.instance.on('query-response', knexOnQueryResponseListener);
    cache.instance.on('query-error', knexOnQueryErrorListener);

    checkConnection(cache.instance);

    return cache.instance;
  } catch (err) {
    emitter.emit('knex-error', 'initialization failure.', { err });

    return cache.instance;
  }
};

export default knexProvider;
