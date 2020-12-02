
declare module '@via-profit-services/knex/webpack-utils' {
  import { WebpackPluginInstance, Configuration } from 'webpack';

  export const ViaProfitKnexWebpackPlugin: WebpackPluginInstance;
  export const webpackMigrationsConfig: Configuration;
}