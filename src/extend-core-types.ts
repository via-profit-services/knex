import { Winston } from '@via-profit-services/core';
import Knex from 'knex';

declare module '@via-profit-services/core' {
  interface Context {

    /**
     * Instance of knex.js
     * @see: https://github.com/knex/knex
     */
    knex: Knex;
  }

  interface LoggersCollection {
    /**
     * Database logger \
     * \
     * Transports:
     *  - `debug` - File transport
     *  - `error` - Console transport
     */
    sql: Winston.Logger;
  }
}