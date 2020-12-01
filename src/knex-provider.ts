import { Winston, ServerError } from '@via-profit-services/core';
import { Knex } from 'index';
import knex, { PgConnectionConfig, MigratorConfig, SeederConfig, PoolConfig } from 'knex';
import moment from 'moment-timezone';
import { performance } from 'perf_hooks';
import { types } from 'pg';

import { DATABASE_CHARSET, DATABASE_CLIENT, DEFAULT_TIMEZONE, ENABLE_PG_TYPES } from './constants';

export interface Configuration {

  /**
   * PostgreSQL connection config
   */
  connection: PgConnectionConfig;

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
  migrations?: MigratorConfig;
  seeds?: SeederConfig;
  pool?: PoolConfig;
}

export interface KnexProviderProps {
  config: Configuration;
  logger: Winston.Logger;
}

const knexProvider = (props: KnexProviderProps) => {
  const { config, logger } = props;
  const { connection, timezone, localTimezone, pool, enablePgTypes } = config;
  const times: { [key: string]: any } = {};
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
    afterCreate: (conn: any, done: any) => {
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

            logger.debug(`The TIMEZONE was set to "${timezone || DEFAULT_TIMEZONE}"`);
            logger.debug(`The charset was set to "${DATABASE_CHARSET}"`);
          }

          done(err, conn);
        },
      );
    },
  };

  const instance = knex({
    client: DATABASE_CLIENT,
    connection,
    pool: knexPool,
  });


  instance
    .on('query', (query) => {
      // eslint-disable-next-line no-underscore-dangle
      const uid = query.__knexQueryUid;

      times[uid] = {
        startTime: performance.now(),
      };
    })
    .on('query-response', (response, query, builder) => {
      // eslint-disable-next-line no-underscore-dangle
      const uid = query.__knexQueryUid;
      const queryTime = performance.now() - times[uid].startTime;

      logger.debug(builder.toString(), { queryTime });
    })
    .on('query-error', (err, query) => {
      logger.error(query.sql, { err, bindings: query.bindings });
    });

  instance
    .raw('SELECT 1+1 AS result')
    .then(() => {
      logger.debug('Test the Database connection by trying to authenticate is OK');

      return true;
    })
    .catch((err) => {
      logger.error(err.name, err);
      throw new ServerError(
        'Database connection failure. Please check your database connection details. Make sure that the database is working properly.',
      );
    });

  return instance;
}

export default knexProvider;
