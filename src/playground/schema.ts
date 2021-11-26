import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID,
  GraphQLString,
} from 'graphql';
import { Context } from '@via-profit-services/core';

/**
 * Simple GraphQL schema
 *
 * SDL of this schema:
 * ```graphql
 * type Query {
 *   users: [User]!
 *   user(id: String!): User
 * }
 *
 * type User {
 *   id: ID!
 *   name: String!
 * }
 * ```
 */

const User = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      users: {
        type: new GraphQLNonNull(new GraphQLList(User)),
        resolve: async (_parent: any, _args: any, context: Context) => {
          const { knex } = context;
          const users = await knex('users').select();

          return users;
        },
      },
      user: {
        type: User,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLString),
          },
        },
        resolve: async (_parent: any, args: { id: string }, context: Context) => {
          const { knex } = context;
          const { id } = args;
          const user = await knex('users').select().where({ id }).first();

          return user || null;
        },
      },
    }),
  }),
});

export default schema;
