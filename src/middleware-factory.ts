import { Middleware, ServerError, Context } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory } from '@via-profit-services/knex';
import type Knex from 'knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

interface Pool {
  knex: Knex;
  context: Context;
}

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = (config) => {
  const { logDir } = config;
  const logger = sqlLogger({ logDir });

  const pool: Pool = {
    knex: null,
    context: null,
  };

  try {
    pool.knex = knexProvider({ logger, config });
  } catch (err) {
    throw new ServerError('Failed to init Knex middleware', { err });
  }

  const middleware: Middleware = ({ context }) => {

    // prevent to combine context twice
    if (pool.context) {
      return pool;
    }

    pool.context = {
      ...context, // original context
      knex: pool.knex, // append knex instance
      logger: {
        ...context.logger, // original loggers
        sql: logger, // append sql logger
      },
    };

    return pool;
  }


  return middleware;
}

export default knexMiddlewareFactory;

