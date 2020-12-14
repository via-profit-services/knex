import { Middleware, ServerError } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory, Knex } from '@via-profit-services/knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = (config) => {
  const { logDir } = config;
  const logger = sqlLogger({ logDir });

  let knex: Knex;
  try {
    knex = knexProvider({ logger, config });
  } catch (err) {
    throw new ServerError('Failed to init Knex middleware', { err });
  }

  const middleware: Middleware = ({ context }) => ({
    context: {
      ...context, // original context
      knex, // append knex instance
      logger: {
        ...context.logger, // original loggers
        sql: logger, // append sql logger
      },
    },
  })


  return middleware;
}

export default knexMiddlewareFactory;

