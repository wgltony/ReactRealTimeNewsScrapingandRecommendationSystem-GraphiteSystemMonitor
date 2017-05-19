import { get } from 'lodash';
import calculateIndices from '../calculate_indices';
import createQuery from '../create_query';
import { ElasticsearchMetric } from '../metrics/metric_classes';

/**
 * Get a list of Cluster UUIDs that exist within the specified timespan.
 *
 * @param {Object} req The incoming request
 * @param {Date} start The start date to look for clusters
 * @param {Date} end The end date to look for clusters
 * @return {Array} Array of strings; one per Cluster UUID.
 */
export function getClusterUuids(req, start, end) {
  const config = req.server.config();
  const indexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');
  const size = config.get('xpack.monitoring.max_bucket_size');

  return calculateIndices(req, start, end, indexPattern)
  .then(indices => fetchClusterUuids(req, indices, start, end, size))
  .then(handleClusterUuidsResponse);
}

/**
 * Fetch the clusters from Elasticsearch using the specified indices, time range, and size limit.
 *
 * @param {Object} req The incoming request
 * @param {Array} indices The ES data indices to use for the lookup
 * @param {Date} start The start date to look for clusters
 * @param {Date} end The end date to look for clusters
 * @return {Promise} Object response from the aggregation.
 */
export function fetchClusterUuids(req, indices, start, end, size) {
  if (indices.length === 0) {
    return Promise.resolve({});
  }

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const params = {
    index: indices,
    type: 'cluster_stats',
    ignoreUnavailable: true,
    filterPath: 'aggregations.cluster_uuids.buckets.key',
    body: {
      size: 0, // return no hits, just aggregation buckets
      query: createQuery({ start, end, metric: ElasticsearchMetric.getMetricFields() }),
      aggs: {
        cluster_uuids: {
          terms: {
            field: 'cluster_uuid',
            size
          }
        }
      }
    }
  };

  return callWithRequest(req, 'search', params);
}

/**
 * Convert the aggregation response into an array of Cluster UUIDs.
 *
 * @param {Object} response The aggregation response
 * @return {Array} Strings; each representing a Cluster's UUID.
 */
export function handleClusterUuidsResponse(response) {
  const uuidBuckets = get(response, 'aggregations.cluster_uuids.buckets', []);

  return uuidBuckets.map(uuidBucket => uuidBucket.key);
}
