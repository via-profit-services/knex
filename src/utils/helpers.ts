import type { InsertOrUpdate, ArrayChunk } from '@via-profit-services/knex';

export const arrayChunk: ArrayChunk = (array, chunkSize) => {
  const chunkedArr = [];
  let index = 0;
  while (index < array.length) {
    chunkedArr.push(array.slice(index, chunkSize + index));
    index += chunkSize;
  }

  return chunkedArr;
}

export const insertOrUpdate: InsertOrUpdate = async (props) => {
  const { knex, data, tableName, chunkSize, constraint } = props;

  await arrayChunk(data, chunkSize || data.length).reduce(async (prevPromise, list) => {
    await prevPromise;

    const insert = knex(tableName).insert(list);
    const update = knex.queryBuilder().update(list);
    const constraintValue = constraint || '(id)';

    return knex.raw(`? on conflict ${constraintValue} do ?`, [insert, update]);
  }, Promise.resolve());
}