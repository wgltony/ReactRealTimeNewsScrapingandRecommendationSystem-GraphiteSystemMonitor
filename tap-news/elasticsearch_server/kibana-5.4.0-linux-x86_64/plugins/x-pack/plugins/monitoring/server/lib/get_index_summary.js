import _ from 'lodash';
import createQuery from './create_query.js';
import { ElasticsearchMetric } from './metrics/metric_classes';

export function handleResponse(resp) {
  const sourceIndexStats = _.get(resp, 'hits.hits[0]._source.index_stats');
  return {
    documents: _.get(sourceIndexStats, 'primaries.docs.count', 0),
    dataSize: _.get(sourceIndexStats, 'total.store.size_in_bytes', 0)
  };
}

export default function getIndexSummary(req, indices) {
  // Get the params from the POST body for the request
  const end = req.payload.timeRange.max;
  const uuid = req.params.clusterUuid;

  // Build up the Elasticsearch request
  const metric = ElasticsearchMetric.getMetricFields();
  const params = {
    index: indices,
    ignore: [404],
    type: 'index_stats',
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({
        end,
        uuid,
        metric,
        filters: [{
          term: { 'index_stats.index': req.params.id }
        }]
      })
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(handleResponse);
};
