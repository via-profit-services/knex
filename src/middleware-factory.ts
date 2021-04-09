import { Middleware } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory } from '@via-profit-services/knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = (configuration) => {
  const middleware: Middleware = ({ context, config }) => {

    const { logDir } = config;

    context.logger.sql = sqlLogger({ logDir })
    context.knex = knexProvider({
      logger: context.logger.sql,
      config: configuration,
    });

    return {
      context,
    };
  }

  return middleware;
}

export default knexMiddlewareFactory;

