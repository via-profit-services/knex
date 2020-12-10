import { GraphqlMiddleware, Middleware, ServerError, Context } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory, Knex } from '@via-profit-services/knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = (config) => {
  const { logDir } = config;
  const logger = sqlLogger({ logDir })

  let knex: Knex;
  try {
    knex = knexProvider({ logger, config });
  } catch (err) {
    throw new ServerError('Failed to init Knex middleware', { err });
  }

  const middleware: Middleware = () => {
    const graphqlMiddleware: GraphqlMiddleware = async (resolve, parent, args, context, info) => {
      const composedContext: Context = {
        ...context, // original context
        knex, // append knex instance
        logger: {
          ...context.logger, // original loggers
          sql: logger, // append sql logger
        },
      };

      return await resolve(parent, args, composedContext, info);
    }

    return graphqlMiddleware;
  }


  return {
    middleware,
  }
}

export default knexMiddlewareFactory;

