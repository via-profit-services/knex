/* eslint-disable import/prefer-default-export */
import { ExtractTotalCountPropOfNode } from '@via-profit-services/knex';

export const extractTotalCountPropOfNode: ExtractTotalCountPropOfNode = (nodes) => ({
  totalCount: nodes?.[0]?.totalCount ?? 0,
  nodes: nodes.map((node) => {
    const newNode = { ...node };
    delete newNode.totalCount;

    return newNode;
  }),
})

