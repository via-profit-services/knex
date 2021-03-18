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
    /^@via-profit-services\/core$/,
    /^moment-timezone$/,
    /^moment$/,
    /^knex$/,
    /^winston$/,
    /^winston-daily-rotate-file$/,

    /^pg$/,
    /^pg-hstore$/,
    /^pg-listen$/,

    ...knexExternals,
  ],
};

export default webpackBaseConfig;
