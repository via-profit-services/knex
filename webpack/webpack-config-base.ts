import { Configuration } from 'webpack';

import { knexExternals } from '../src/webpack-utils';

const webpackBaseConfig: Configuration = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  externals: [
    /^@via-profit-services\//,
    /^knex$/,
    /^winston$/,
    /^winston-daily-rotate-file$/,

    /^graphql$/,
    /^pg$/,
    /^pg-/,
    /^mysql$/,
    /^sqlite$/,
    ...knexExternals,
  ],
};

export default webpackBaseConfig;
