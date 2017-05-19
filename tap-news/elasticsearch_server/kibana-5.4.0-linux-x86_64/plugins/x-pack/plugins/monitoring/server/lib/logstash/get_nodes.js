/*
 * Get detailed info for Logstash's in the cluster
 * for Logstash nodes listing page
 * For each instance:
 *  - name
 *  - status
 *  - JVM memory
 *  - os load average
 *  - events
 *  - config reloads
 */
import { get, isArray } from 'lodash';
import moment from 'moment';
import Promise from 'bluebird';
import createQuery from './../create_query';
import calculateAvailability from './../calculate_availability';
import { ElasticsearchMetric } from './../metrics/metric_classes';

export default function getNodes(req, indices) {
  if (indices.length < 1) return Promise.resolve([]);

  const config = req.server.config();
  const start = moment.utc(req.payload.timeRange.min).valueOf();
  const end = moment.utc(req.payload.timeRange.max).valueOf();
  const uuid = req.params.clusterUuid;
  const metric = ElasticsearchMetric.getMetricFields();
  const params = {
    index: indices,
    type: 'logstash_stats',
    ignoreUnavailable: true,
    body: {
      size: 0,
      query: createQuery({ start, end, uuid, metric }),
      aggs: {
        logstash_uuids: {
          terms: {
            field: 'logstash_stats.logstash.uuid',
            size: config.get('xpack.monitoring.max_bucket_size')
          }
        }
      }
    }
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'search', params)
  .then(statsResp => {
    const statsBuckets = get(statsResp, 'aggregations.logstash_uuids.buckets');
    if (isArray(statsBuckets)) {
      return Promise.map(statsBuckets, (uuidBucket) => {
        const infoParams = {
          index: config.get('xpack.monitoring.index'),
          type: 'logstash',
          id: uuidBucket.key,
          _source: [
            'timestamp',
            'logstash.process.cpu.percent',
            'logstash.jvm.mem.heap_used_percent',
            'logstash.jvm.uptime_in_millis',
            'logstash.events.out',
            'logstash.logstash.http_address',
            'logstash.logstash.name',
            'logstash.logstash.host',
            'logstash.logstash.uuid',
            'logstash.logstash.status',
            'logstash.logstash.version',
            'logstash.logstash.pipeline',
            'logstash.reloads'
          ]
        };

        return callWithRequest(req, 'get', infoParams)
        .then(infoResp => {
          return {
            ...get(infoResp, '_source.logstash'),
            availability: calculateAvailability(get(infoResp, '_source.timestamp'))
          };
        });
      });
    }
  });
};
