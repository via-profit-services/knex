import fs from 'fs';
import path from 'path';
import { Configuration, Entry } from 'webpack';

import { MigrationConfigFactory, MigrationsConfigProps } from '../@types/webpack-utils';
import ViaProfitKnexWebpackPligin from './plugin';


const migrationsConfig: MigrationConfigFactory = (props) => {

  const defaultProps: Required<MigrationsConfigProps> = {
    prefix: '.knex',
    knexfile: path.resolve(process.cwd(), './utils/knexfile.ts'),
    migrationsSourceDir: path.resolve(process.cwd(), './database/migrations'),
    seedsSourceDir: path.resolve(process.cwd(), './database/seeds'),
  };

  const config = {
    ...defaultProps,
    ...props || {},
  }

  const { migrationsSourceDir, seedsSourceDir, knexfile, prefix } = config;
  const entry: Entry = {};

  // read mifgration directory and get all migration files path
  if (fs.existsSync(migrationsSourceDir)) {
    fs.readdirSync(migrationsSourceDir).forEach((filename) => {
      const basename = path.basename(filename.replace(/\.ts$/, ''));
      entry[`migrations/${basename}`] = path.resolve(migrationsSourceDir, filename);
    });
  }

  // read mifgration directory and get all migration files path
  if (fs.existsSync(seedsSourceDir)) {
    fs.readdirSync(seedsSourceDir).forEach((filename) => {
      const basename = path.basename(filename.replace(/\.ts$/, ''));
      entry[`seeds/${basename}`] = path.resolve(seedsSourceDir, filename);
    });
  }


  // set knexfile entry
  if (fs.existsSync(knexfile)) {
    entry.knexfile = knexfile;
  }

  const webpackConfig: Configuration = {
    mode: 'development',
    optimization: {
      minimize: false,
    },
    entry,
    output: {
      path: path.resolve(process.cwd(), prefix),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    plugins: [
      new ViaProfitKnexWebpackPligin(),
    ],
    externals: [
      /^@via-profit-services\//,
    ],
  };

  return webpackConfig;
}


export default migrationsConfig;
