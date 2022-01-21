import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLInputObjectType,
} from 'graphql';
import { Context } from '@via-profit-services/core';

const User = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

const CreateUserInput = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
  },
});

const Query = new GraphQLObjectType<unknown, Context>({
  name: 'Query',
  fields: () => ({
    getUser: {
      type: User,
      args: {
        id: {
          type: new GraphQLNonNull(GraphQLID),
        },
      },
      resolve: async (_parent: any, args: { id: string }, context) => {
        const { knex } = context;
        const { id } = args;
        const user = await knex('users').select().where({ id }).first();

        return user || null;
      },
    },
  }),
});

const Mutation = new GraphQLObjectType<unknown, Context>({
  name: 'Mutation',
  fields: {
    createUser: {
      type: new GraphQLNonNull(User),
      args: {
        input: { type: new GraphQLNonNull(CreateUserInput) },
      },
      resolve: async (_parent, args: { input: { id: string; name: string } }, context) => {
        const { knex } = context;
        const { id, name } = args.input;

        await knex('users').insert({ id, name });
        const user = await knex('users').select('*').where({ id }).first();
        await knex('users').del();

        return user;
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
});

export default schema;
