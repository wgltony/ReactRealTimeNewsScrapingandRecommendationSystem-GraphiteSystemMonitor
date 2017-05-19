import _ from 'lodash';
import createQuery from './create_query.js';
import { ElasticsearchMetric } from './metrics/metric_classes';

export default function getLastState(req, indices) {
  const end = req.payload.timeRange.max;
  const uuid = req.params.clusterUuid;
  const config = req.server.config();
  const resolver = config.get('xpack.monitoring.node_resolver');

  const metric = ElasticsearchMetric.getMetricFields();
  const params = {
    index: indices,
    type: 'cluster_state',
    ignore: [404],
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({ end, uuid, metric })
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(resp => {
    const total = _.get(resp, 'hits.total', 0);
    if (!total) {
      // time frame is out of bounds with indexed data
      return {
        cluster_state: {
          state_uuid: 'devnull',
          nodes: {}
        }
      };
    }
    const lastState = _.get(resp, 'hits.hits[0]._source');
    const nodes = _.get(lastState, 'cluster_state.nodes');
    if (nodes) {
      // re-key the nodes objects to use resolver if it's not the UUID (it's already keyed by UUID!)
      if (resolver !== 'uuid') {
        lastState.cluster_state.nodes = _.indexBy(nodes, node => node[resolver]);
      }
    }
    return lastState;
  });
};
