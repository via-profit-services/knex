import http from 'node:http';
import path from 'node:path';
import { graphqlHTTPFactory } from '@via-profit-services/core';

import schema from './schema';
import knexMiddlewareFactory from '../middleware-factory';

const server = http.createServer();
const port = 8081;

const startServer = async () =>
  new Promise<void>(resolve => {
    const { knexMiddleware, knexInstance } = knexMiddlewareFactory({
      client: 'sqlite3',
      connection: {
        filename: path.resolve(__dirname, './database.sqlite'),
      },
    });

    const graphqlHTTP = graphqlHTTPFactory({
      schema,
      middleware: [knexMiddleware],
    });

    server.on('request', graphqlHTTP);
    server.on('close', () => knexInstance.destroy());
    server.listen(port, () => resolve());
  });

const stopServer = async () =>
  new Promise<void>(resolve => {
    server.close(() => resolve());
  });

interface Response extends http.IncomingMessage {
  data?: any;
  errors?: Record<string, any>[];
}
type GraphQLRequest = (props: {
  query: string;
  variables?: Record<string, any>;
}) => Promise<Response>;

const graphQLRequest: GraphQLRequest = props =>
  new Promise<Response>(resolve => {
    const { query, variables } = props;
    const request = http.request(
      {
        port,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      socket => {
        const buffers: Buffer[] = [];
        socket.on('data', buffer => buffers.push(buffer));
        socket.on('close', () => {
          const response = Buffer.concat(buffers).toString();
          const { data, errors } = JSON.parse(response);

          (socket as Response).data = data;
          (socket as Response).errors = errors;
          resolve(socket);
        });
      },
    );

    request.write(
      JSON.stringify({
        variables,
        query,
      }),
    );

    request.end();
  });

export { startServer, stopServer, graphQLRequest };
