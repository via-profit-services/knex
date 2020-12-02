  import { WebpackPluginInstance, Configuration, Compiler } from 'webpack';

  export interface MigrationsConfigProps {
    knexfile?: string;
    prefix?: string;
    migrationsSourceDir?: string;
    seedsSourceDir?: string;
  }

  export type MigrationConfigFactory = (props?: MigrationsConfigProps) => Configuration;

  export class ViaProfitKnexWebpackPlugin implements WebpackPluginInstance {
    apply(compiler: Compiler): void;
  }

  export const webpackMigrationsConfig: MigrationConfigFactory;

  export const knexExternals: RegExp[];