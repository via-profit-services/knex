import { Middleware, ServerError } from '@via-profit-services/core';
import * as Knex from 'knex';

import './extend-core-types';
import knexProvider, { Configuration } from './knex-provider';
import sqlLogger from './logger';


const knexMiddleware = (props: Configuration): Middleware => {
  const middleware: Middleware = {
    context: ({ context, config }) => {
      try {
        const { logDir } = config;
        const logger = sqlLogger({ logDir })
        const knex = knexProvider({ logger, config: props });

        return {
          ...context, // original context
          knex, // append knex instance
          logger: {
            ...context.logger, // original loggers
            logger, // append sql logger
          },
        }
      } catch (err) {
        throw new ServerError('Failed to init Knex middleware', { err });
      }
    },
  };

  return middleware;
}

export { Knex, knexMiddleware };

export default knexMiddleware;
