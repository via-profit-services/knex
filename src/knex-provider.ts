import { ServerError } from '@via-profit-services/core';
import type { KnexProvider } from '@via-profit-services/knex';

import type { Knex } from 'knex';
import knex from 'knex';
import moment from 'moment-timezone';
import { performance } from 'perf_hooks';
import { types } from 'pg';

import { DATABASE_CHARSET, DATABASE_CLIENT, DEFAULT_TIMEZONE, ENABLE_PG_TYPES } from './constants';

interface Times {
  [key: string]: {
    startTime: number;
  };
}

type KnexQuery = {
  __knexQueryUid: string;
  sql: string;
  bindings: any;
}

type Cache = {
  instance: Knex;
};

const cache: Cache = {
  instance: null,
}

const knexProvider: KnexProvider = (props) => {

  if (cache.instance) {
    return cache.instance;
  }

  const { config, logger } = props;
  const { connection, timezone, localTimezone, pool, enablePgTypes } = config;
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
          SET TIMEZONE = '${timezone || DEFAULT_TIMEZONE}';
          SET CLIENT_ENCODING = ${DATABASE_CHARSET};
        `,
        (err: any) => {
          if (err) {
            console.error(err);
            logger.debug('Connection error', { err });
          } else {

            logger.debug(`Database connection is OK. TIMEZONE=${timezone || DEFAULT_TIMEZONE}. CLIENT_ENCODING=${DATABASE_CHARSET}`);
          }

          done(err, conn);
        },
      );
    },
  };


  const knexOnQueryListener = (query: KnexQuery) => {
    const { __knexQueryUid } = query;

    times[__knexQueryUid] = {
      startTime: performance.now(),
    };
  }

  const knexOnQueryResponseListener = (response: any, query: KnexQuery, builder: any) => {
    const { __knexQueryUid } = query;
    const queryTime = performance.now() - (times[__knexQueryUid]?.startTime || 0);

    logger.debug(builder.toString(), { queryTime });
  }

  const knexOnQueryErrorListener = (err: Error, query: KnexQuery) => {
    logger.error(query.sql, { err, bindings: query.bindings });
  }

  const checkConnection = async (knexHandle: Knex): Promise<void> => {
    logger.debug('Check connection');

    return knexHandle
    .raw('SELECT 1+1 AS result')
    .then(() => {
      logger.debug('Test the Database connection by trying to authenticate is OK');
    })
    .catch((err) => {
      logger.error(err.name, err);
      throw new ServerError(
        'Database connection failure. Please check your database connection details. Make sure that the database is working properly.',
      );
    });
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
