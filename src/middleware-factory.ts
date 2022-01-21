import { Middleware } from '@via-profit-services/core';
import type { Knex } from 'knex';
import knex from 'knex';
import { performance } from 'perf_hooks';

import { QUERY_TIME_LIMIT_PANIC, QUERY_TIME_LIMIT_SLOW } from './constants';
import {
  KnexGraphqlMiddlewareFactory,
  QueryTimeConfig,
  KnexQuery,
  Times,
} from '@via-profit-services/knex';

const knexMiddlewareFactory: KnexGraphqlMiddlewareFactory = configuration => {
  const { queryTimeLimit, ...knexConfig } = configuration;
  const times: Times = {};
  const knexInstance = knex(knexConfig);

  const knexMiddleware: Middleware = ({ context, stats }) => {
    const queryTimeConfig: QueryTimeConfig = {
      slow: QUERY_TIME_LIMIT_SLOW,
      panic: QUERY_TIME_LIMIT_PANIC,
      ...queryTimeLimit,
    };

    const knexOnQueryErrorListener = (err: Error, _query: KnexQuery) => {
      context.emitter.emit('knex-error', err);
    };

    const knexOnQueryResponseListener = (
      _response: any,
      query: KnexQuery,
      builder: Knex.QueryBuilder,
    ) => {
      const { __knexQueryUid } = query;
      const queryTimeMs = performance.now() - (times[__knexQueryUid]?.startTime || 0);
      let queryTimeLabel = '[normal]';

      if (queryTimeMs > queryTimeConfig.panic) {
        queryTimeLabel = '[panic] ';
      }

      if (queryTimeMs > queryTimeConfig.slow) {
        queryTimeLabel = '[slow]  ';
      }

      if (process.env.NODE_ENV === 'development' && queryTimeLabel !== '[normal]') {
        // eslint-disable-next-line no-console
        console.log(
          '\x1b[33m%s\x1b[0m \x1b[34m%s\x1b[0m \x1b[90m%s\x1b[0m',
          'SQL slow query at',
          `${queryTimeMs.toFixed(3)} ms`,
          `${builder.toString().substring(0, 70)}...`,
        );
      }

      context.emitter.emit(
        'knex-debug',
        `${queryTimeLabel} ${queryTimeMs.toFixed(3)} ms: ${builder.toString()}`,
      );
    };

    const knexOnQueryListener = (query: KnexQuery) => {
      const { __knexQueryUid } = query;

      times[__knexQueryUid] = {
        startTime: performance.now(),
      };
    };

    if (stats.requestCounter === 1) {
      context.knex = knexInstance;

      context.knex.on('query', knexOnQueryListener);
      context.knex.on('query-response', knexOnQueryResponseListener);
      context.knex.on('query-error', knexOnQueryErrorListener);
    }
  };

  return {
    knexMiddleware,
    knexInstance,
  };
};

export default knexMiddlewareFactory;
