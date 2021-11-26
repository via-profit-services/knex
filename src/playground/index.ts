/* eslint-disable no-console */
import * as core from '@via-profit-services/core';
import express from 'express';
import path from 'path';
import { createServer } from 'http';

import schema from './schema';
import * as knex from '../index';
import graphiql from './graphiql';

(async () => {
  const port = 8085;
  const app = express();
  const server = createServer(app);

  const knexMiddleware = knex.factory({
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, './database.sqlite'),
    },
  });

  const { graphQLExpress } = await core.factory({
    server,
    schema,
    middleware: [
      // subscribe to events
      async ({ context, requestCounter }) => {
        if (requestCounter === 1) {
          context.emitter.on('knex-error', msg => console.error('[Knex error]', msg));
          context.emitter.on('knex-warning', msg => console.warn('[Knex warn]', msg));
          context.emitter.on('knex-debug', msg => console.info('[Knex debug]', msg));
        }

        return { context };
      },
      // connect knex middleware
      knexMiddleware,
      async ({ context }) => {
        const { knex } = context;

        const tableExist = await knex.schema.hasTable('users');
        if (!tableExist) {
          await knex.schema.createTable('users', table => {
            table.string('id', 50).primary();
            table.string('name', 255);
          });

          await knex('users')
            .insert([
              {
                id: '9d01c0fb-427b-40f0-aaab-cfabfba54b86',
                name: 'Leonardo',
              },
              {
                id: '48a26038-6dd3-4dd6-9221-ac5ac1228a68',
                name: 'Raphael',
              },
              {
                id: '1cd9f95c-633e-44e5-89ab-1edaeae6e4c4',
                name: 'Donatello',
              },
              {
                id: '33a726a1-051a-4124-b8d1-68cea9c752a2',
                name: 'Michelangelo',
              },
              {
                id: 'a055095f-8f62-41b8-933e-86d8190faf37',
                name: 'Splinter',
              },
              {
                id: '0fcedb75-e37b-46a7-9ce4-bef495f8e2fd',
                name: 'Shredder',
              },
            ])
            .onConflict('id')
            .ignore();
        }

        return context;
      },
    ],
  });

  app.use('/graphql', graphQLExpress);
  app.use(
    '/',
    graphiql({
      query: `query UsersList {
  users {
    ...UserFragment
  }
}

query User {
  user(id: "48a26038-6dd3-4dd6-9221-ac5ac1228a68") {
    ...UserFragment
  }
}

fragment UserFragment on User {
  id
  name
}
`,
    }),
  );

  server.listen(port, () => {
    console.info(`GraphQL server started at port ${port}`);
  });
})();
