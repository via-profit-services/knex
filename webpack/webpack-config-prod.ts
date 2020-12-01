import path from 'path';
import { BannerPlugin, Configuration } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import packageInfo from '../package.json';
import { ViaProfitKnexWebpackPlugin } from '../src/webpack-utils';
import webpackBaseConfig from './webpack-config-base';

const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
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
    new ViaProfitKnexWebpackPlugin(),
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
  ],
  externals: {
    '@via-profit-services/core': '@via-profit-services/core',
    'supports-color': 'supports-color',
    'moment-timezone': 'moment-timezone',
    moment: 'moment',
  },
});

export default webpackProdConfig;
