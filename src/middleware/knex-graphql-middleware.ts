import { GraphqlMiddleware, ServerError, Context, GraphqlMiddlewareFactoryProps } from '@via-profit-services/core';
import { Configuration, Knex } from '@via-profit-services/knex';

import sqlLogger from '../knex-logger';
import knexProvider from '../knex-provider';


type KnexGraphqlMiddleware = (
  props: GraphqlMiddlewareFactoryProps & Configuration
) => GraphqlMiddleware;

const knexGraphqlMiddleware: KnexGraphqlMiddleware = (props) => {
  const { config } = props;
  const { logDir } = config;
  const logger = sqlLogger({ logDir })

  let knex: Knex;
  try {
    knex = knexProvider({ logger, config: props });

  } catch (err) {
    throw new ServerError('Failed to init Knex middleware', { err });
  }

  const middleware: GraphqlMiddleware = async (resolve, parent, args, context, info) => {

    const composedContext: Context = {
      ...context, // original context
      knex, // append knex instance
      logger: {
        ...context.logger, // original loggers
        sql: logger, // append sql logger
      },
    };

    return resolve(parent, args, composedContext, info);
  }

  return middleware;
}

export default knexGraphqlMiddleware;
