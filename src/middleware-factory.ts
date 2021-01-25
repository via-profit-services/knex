import { Middleware } from '@via-profit-services/core';
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

    pool.context = context;
    pool.context.logger.sql = sqlLogger({ logDir })
    pool.context.knex = knexProvider({
      logger: pool.context.logger.sql,
      config: configuration,
    });


    return pool;
  }


  return middleware;
}

export default knexMiddlewareFactory;

