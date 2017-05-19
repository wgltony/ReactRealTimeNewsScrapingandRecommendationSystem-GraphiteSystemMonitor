import _ from 'lodash';
import createQuery from './create_query.js';
import { ElasticsearchMetric } from './metrics/metric_classes';

export function handleResponse(lastState) {
  return (resp) => {
    let clusterStatus = { status: _.get(lastState, 'cluster_state.status') };
    const total = _.get(resp, 'hits.total', 0);

    if (total) {
      const source = _.get(resp, 'hits.hits[0]._source');
      const get = (path) => _.get(source, path);
      clusterStatus.nodesCount = get('cluster_stats.nodes.count.total');
      clusterStatus.indicesCount = get('cluster_stats.indices.count');
      clusterStatus.totalShards = get('cluster_stats.indices.shards.total');
      clusterStatus.documentCount = get('cluster_stats.indices.docs.count');
      clusterStatus.dataSize = get('cluster_stats.indices.store.size_in_bytes');
      clusterStatus.upTime = get('cluster_stats.nodes.jvm.max_uptime_in_millis');
      clusterStatus.version = get('cluster_stats.nodes.versions');
      clusterStatus.memUsed = get('cluster_stats.nodes.jvm.mem.heap_used_in_bytes');
      clusterStatus.memMax = get('cluster_stats.nodes.jvm.mem.heap_max_in_bytes');
    }

    clusterStatus = _.defaults(clusterStatus, {
      status: 'unknown',
      nodesCount: 0,
      indicesCount: 0,
      totalShards: 0,
      documentCount: 0,
      dataSize: 0,
      upTime: 0,
      version: null,
      memUsed: 0,
      memMax: 0
    });

    return clusterStatus;
  };
}

export default function getClusterStatus(req, indices, lastState) {
  // Get the params from the POST body for the request
  const end = req.payload.timeRange.max;
  const uuid = req.params.clusterUuid;

  // Build up the Elasticsearch request
  const metric = ElasticsearchMetric.getMetricFields();
  const params = {
    index: indices,
    ignore: [404],
    type: 'cluster_stats',
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({ end, uuid, metric })
    }
  };

  // Send the request to Elasticsearch with authentication headers. This will handle
  // 401 from the Sheild plugin and send them back to the browser
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params).then(handleResponse(lastState));
};
