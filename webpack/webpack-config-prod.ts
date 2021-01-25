import fs from 'fs';
import path from 'path';
import { BannerPlugin, Configuration, Compiler } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import packageInfo from '../package.json';
import { knexExternals } from '../src/webpack-utils';
import webpackBaseConfig from './webpack-config-base';

const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
  optimization: {
    minimize: false,
  },
  entry: {
    index: path.resolve(__dirname, '../src/index.ts'),
    'webpack-utils': path.resolve(__dirname, '../src/webpack-utils/index.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: 'production',
  plugins: [
    // new ViaProfitKnexWebpackPlugin(),
    new BannerPlugin({
      banner: `
Via Profit Services / Knex

Repository ${packageInfo.repository.url}
Contact    ${packageInfo.support}
      `,
      test: /index\.js/,
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE ? 'server' : 'disabled',
      openAnalyzer: true,
    }),
    {
      apply: (compiler: Compiler) => {
        compiler.hooks.beforeRun.tapAsync('WebpackBeforeBuild', (_, callback) => {

          if (fs.existsSync(path.join(__dirname, '../dist/'))) {
            fs.rmdirSync(path.join(__dirname, '../dist/'), { recursive: true })
          }

          callback();
        });

        compiler.hooks.afterEmit.tapAsync('WebpackAfterBuild', (_, callback) => {
          fs.copyFileSync(
            path.resolve(__dirname, '../src/@types/index.d.ts'),
            path.resolve(__dirname, '../dist/index.d.ts'),
          );
          fs.copyFileSync(
            path.resolve(__dirname, '../src/@types/webpack-utils.d.ts'),
            path.resolve(__dirname, '../dist/webpack-utils.d.ts'),
          );
          callback();
        });

      },
    },
  ],
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
});

export default webpackProdConfig;
