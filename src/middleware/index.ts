import type { Middleware } from '@via-profit-services/core';
import type { Configuration } from '@via-profit-services/knex';

import graphqlMiddleware from './knex-graphql-middleware';

const middleware = (props: Configuration): Middleware => ({
  graphql: (middlewareProps) => graphqlMiddleware({ ...middlewareProps, ...props }),
});

export default middleware;
