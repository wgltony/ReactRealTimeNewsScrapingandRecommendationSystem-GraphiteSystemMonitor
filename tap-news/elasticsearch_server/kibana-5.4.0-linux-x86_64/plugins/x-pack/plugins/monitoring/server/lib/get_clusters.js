import _ from 'lodash';
import Promise from 'bluebird';
import createQuery from './create_query.js';
import validateMonitoringLicense from './validate_monitoring_license';
import { ElasticsearchMetric } from './metrics/metric_classes';

export default function getClusters(req, indices) {
  const config = req.server.config();
  // Get the params from the POST body for the request
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const metric = ElasticsearchMetric.getMetricFields();
  const filters = [];
  if (req.params.clusterUuid) {
    filters.push({ term: { 'cluster_uuid': req.params.clusterUuid } });
  }
  const params = {
    index: indices,
    type: 'cluster_stats',
    ignore: [404],
    // terms agg for the cluster_uuids
    body: {
      size: 0, // return no hits, just aggregation buckets
      query: createQuery({
        start,
        end,
        uuid: null,
        metric,
        filters
      }),
      aggs: {
        cluster_uuids: {
          terms: {
            field: 'cluster_uuid',
            size: config.get('xpack.monitoring.max_bucket_size')
          }
        }
      }
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(statsResp => {
    const statsBuckets = _.get(statsResp, 'aggregations.cluster_uuids.buckets');
    if (_.isArray(statsBuckets)) {

      return Promise.map(statsBuckets, (uuidBucket) => {
        const cluster = {
          cluster_uuid: uuidBucket.key
        };

        const infoParams = {
          index: config.get('xpack.monitoring.index'),
          type: 'cluster_info',
          id: cluster.cluster_uuid
        };

        return callWithRequest(req, 'get', infoParams)
        .then(infoResp => {
          const infoDoc = infoResp._source;

          cluster.cluster_name = infoDoc.cluster_name;
          cluster.version = infoDoc.version;
          const license = infoDoc.license;
          if (license && validateMonitoringLicense(cluster.cluster_uuid, license)) {
            cluster.license = license;
          } else {
            // allow deleted/unknown license clusters to show in UI
            cluster.license = null;
          }

          return cluster;
        });
      });
    }
  });
};
