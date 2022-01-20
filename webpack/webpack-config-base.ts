import { Configuration } from 'webpack';

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
    /^busboy/,
    /^@via-profit-services\//,
    /^knex$/,
    /^winston$/,
    /^winston-daily-rotate-file$/,

    /^graphql$/,
    /^pg$/,
    /^pg-/,
    // KNEX ignore not postgress drivers
    /sqlite3/,
    /mysql2/,
    /mssql/,
    /mariasql/,
    /mysql/,
    /oracle/,
    /strong-oracle/,
    /oracledb/,
    /pg-native/,
    /pg-query-stream/,

    // KNEX artifacts
    /import-file/,
  ],
};

export default webpackBaseConfig;
