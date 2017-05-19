/*
 * Determine node type using following rules:
 *  - data only node: --node.master=false
 *  - master only node: --node.data=false
 *  - client only node: --node.data=false --node.master=false
 *  https://www.elastic.co/guide/en/elasticsearch/reference/2.x/modules-node.html
 */
import { includes, isUndefined } from 'lodash';

export default function calculateNodeType(node, state) {
  const attrs = node.attributes || {};

  function mightBe(attr) {
    return attr === 'true' || isUndefined(attr);
  }

  function isNot(attr) {
    return attr === 'false';
  }

  // NOTE: calculating if node is master node is the only thing node ID should be used for
  if (includes(node.node_ids, state.master_node)) return 'master';

  if (isNot(attrs.data) && isNot(attrs.master)) return 'client';
  if (mightBe(attrs.master) && isNot(attrs.data)) return 'master_only';
  if (mightBe(attrs.data) && isNot(attrs.master)) return 'data';
  return 'node';
};
