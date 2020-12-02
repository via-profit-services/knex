const externals = [

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
];

export default externals;
