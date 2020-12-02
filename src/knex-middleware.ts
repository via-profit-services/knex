import { Middleware, ServerError, Context } from '@via-profit-services/core';
import { KnexMiddleware } from '@via-profit-services/knex';

import sqlLogger from './knex-logger';
import knexProvider from './knex-provider';

const knexMiddleware: KnexMiddleware = (props) => {
  const middleware: Middleware = {
    context: ({ context, config }): Context => {
      try {
        const { logDir } = config;
        const logger = sqlLogger({ logDir })
        const knex = knexProvider({ logger, config: props });

        return {
          ...context, // original context
          knex, // append knex instance
          logger: {
            ...context.logger, // original loggers
            sql: logger, // append sql logger
          },
        }
      } catch (err) {
        throw new ServerError('Failed to init Knex middleware', { err });
      }
    },
  };

  return middleware;
}


export default knexMiddleware;
