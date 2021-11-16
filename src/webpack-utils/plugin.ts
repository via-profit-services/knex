import { WebpackPluginInstance, Compiler } from 'webpack';

import externals from './knex-externals';

interface CheckIgnoreArgs {
  request: string;
  context: string;
}

type IgnoreModules = {
  resourceRegExp: RegExp;
  contextRegExp?: RegExp;
}[];

class ViaProfitKnexWebpackPlugin implements WebpackPluginInstance {
  // ignore webpack plugin template
  ignoreModules: IgnoreModules = externals.map(resourceRegExp => ({
    resourceRegExp,
  }));

  constructor() {
    this.checkIgnore = this.checkIgnore.bind(this);
  }

  checkIgnore({ request, context }: CheckIgnoreArgs): false | undefined {
    let retState = undefined;
    this.ignoreModules.forEach(({ resourceRegExp, contextRegExp }) => {
      if (resourceRegExp.test(request)) {
        if (typeof contextRegExp !== 'undefined' && contextRegExp.test(context)) {
          retState = false;
        } else {
          retState = false;
        }
      }
    });

    return retState;
  }

  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap('ViaProfitPlugin', nmf => {
      nmf.hooks.beforeResolve.tap('ViaProfitPlugin', this.checkIgnore);
    });

    compiler.hooks.contextModuleFactory.tap('ViaProfitPlugin', cmf => {
      cmf.hooks.beforeResolve.tap('ViaProfitPlugin', this.checkIgnore);
    });
  }
}

export { ViaProfitKnexWebpackPlugin };
export default ViaProfitKnexWebpackPlugin;
