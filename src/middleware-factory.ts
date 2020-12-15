import { Middleware, ServerError, Context } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory } from '@via-profit-services/knex';
import type Knex from 'knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

interface Pool {
  knex: Knex;
  context: Context;
}

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = (configuration) => {

  const pool: Pool = {
    knex: null,
    context: null,
  };


  const middleware: Middleware = ({ context, config }) => {

    // prevent to combine context twice
    if (pool.context) {
      return pool;
    }

    const { logDir } = config;
    const logger = sqlLogger({ logDir });

    try {
      pool.knex = knexProvider({
        logger,
        config: configuration,
      });

    } catch (err) {
      throw new ServerError('Failed to init Knex middleware', { err });
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

