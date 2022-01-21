import { v4 as uuidv4 } from 'uuid';

import { startServer, stopServer, graphQLRequest } from './configure-test';

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});

describe('GraphQL request with database select', () => {
  it('Should create a new user in database ,return it and then remove', async () => {
    const userID = uuidv4();
    const response = await graphQLRequest({
      query: /* GraphQL */ `
        mutation CreateUserMutation($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
          }
        }
      `,
      variables: {
        input: {
          id: userID,
          name: 'Alesha',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.data.createUser).toEqual(
      expect.objectContaining({
        id: userID,
        name: 'Alesha',
      }),
    );
  });
});
