import { Middleware } from '@via-profit-services/core';
import { KnexGraphqlMiddlewareFactory } from '@via-profit-services/knex';

import knexProvider from './knex-provider';

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = configuration => {
  const middleware: Middleware = ({ context }) => {
    context.knex = knexProvider({
      config: configuration,
      emitter: context.emitter,
    });
  };

  return middleware;
};

export default knexMiddlewareFactory;
