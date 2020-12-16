import { Middleware, ServerError } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory } from '@via-profit-services/knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = (configuration) => {

  const pool: ReturnType<Middleware> = {
    context: null,
  };


  const middleware: Middleware = ({ context, config }) => {

    // prevent to combine context twice
    if (pool.context !== null) {
      return pool;
    }

    const { logDir } = config;

    try {
      pool.context = context;
      pool.context.logger.sql = sqlLogger({ logDir })
      pool.context.knex = knexProvider({
        logger: pool.context.logger.sql,
        config: configuration,
      })

    } catch (err) {
      throw new ServerError('Failed to init Knex middleware', { err });
    }


    return pool;
  }


  return middleware;
}

export default knexMiddlewareFactory;

