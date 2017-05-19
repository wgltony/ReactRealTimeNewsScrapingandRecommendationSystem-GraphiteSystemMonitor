/*
 * Get high-level info for Logstashs in a set of clusters
 * The set contains multiple clusters for cluster listing page
 * The set contains single cluster for cluster overview page and cluster status bar

 * Timespan for the data is an interval of time based on calculations of an
 * interval size using the same calculation as determining bucketSize using
 * the timepicker for a chart

 * Returns, for each cluster,
 *  - number of instances
 *  - combined health
 */
import Promise from 'bluebird';
import _ from 'lodash';
import createQuery from './../create_query.js';
import { ElasticsearchMetric } from './../metrics/metric_classes';

export default function getLogstashForClusters(req, indices) {
  if (indices.length < 1) return () => Promise.resolve([]);

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const config = req.server.config();

  return function (clusters) {
    return Promise.map(clusters, cluster => {
      const clusterUuid = cluster.cluster_uuid;
      const metric = ElasticsearchMetric.getMetricFields();
      const params = {
        size: 0,
        index: indices,
        ignoreUnavailable: true,
        type: 'logstash_stats',
        body: {
          query: createQuery({
            start,
            end,
            uuid: clusterUuid,
            metric
          }),
          aggs: {
            logstash_uuids: {
              terms: {
                field: 'logstash_stats.logstash.uuid',
                size: config.get('xpack.monitoring.max_bucket_size')
              },
              aggs: {
                latest_report: {
                  terms: {
                    field: 'logstash_stats.timestamp',
                    size: 1,
                    order: {
                      '_term' : 'desc'
                    }
                  },
                  aggs: {
                    memory_used: {
                      max: {
                        field: 'logstash_stats.jvm.mem.heap_used_in_bytes'
                      }
                    },
                    memory: {
                      max: {
                        field: 'logstash_stats.jvm.mem.heap_max_in_bytes'
                      }
                    },
                    events_in_total: {
                      max: {
                        field: 'logstash_stats.events.in'
                      }
                    },
                    events_out_total: {
                      max: {
                        field: 'logstash_stats.events.out'
                      }
                    }
                  }
                },
                memory_used_per_node: {
                  max_bucket: {
                    buckets_path: 'latest_report>memory_used'
                  }
                },
                memory_per_node: {
                  max_bucket: {
                    buckets_path: 'latest_report>memory'
                  }
                },
                events_in_total_per_node: {
                  max_bucket: {
                    buckets_path: 'latest_report>events_in_total'
                  }
                },
                events_out_total_per_node: {
                  max_bucket: {
                    buckets_path: 'latest_report>events_out_total'
                  }
                }
              }
            },
            events_in_total: {
              sum_bucket: {
                buckets_path: 'logstash_uuids>events_in_total_per_node'
              }
            },
            events_out_total: {
              sum_bucket: {
                buckets_path: 'logstash_uuids>events_out_total_per_node'
              }
            },
            memory_used: {
              sum_bucket: {
                buckets_path: 'logstash_uuids>memory_used_per_node'
              }
            },
            memory: {
              sum_bucket: {
                buckets_path: 'logstash_uuids>memory_per_node'
              }
            },
            max_uptime: {
              max: {
                field: 'logstash_stats.jvm.uptime_in_millis'
              }
            }
          }
        }
      };

      return callWithRequest(req, 'search', params)
      .then(result => {
        const getResultAgg = key => _.get(result, `aggregations.${key}`);
        const logstashUuids =  getResultAgg('logstash_uuids.buckets');

        // everything is initialized such that it won't impact any rollup
        let eventsInTotal = 0;
        let eventsOutTotal = 0;
        let memory = 0;
        let memoryUsed = 0;
        let maxUptime = 0;

        // if the cluster has logstash instances at all
        if (logstashUuids.length) {
          eventsInTotal = getResultAgg('events_in_total.value');
          eventsOutTotal = getResultAgg('events_out_total.value');
          memory = getResultAgg('memory.value');
          memoryUsed = getResultAgg('memory_used.value');
          maxUptime = getResultAgg('max_uptime.value');
        }

        return {
          clusterUuid,
          stats: {
            count: logstashUuids.length,
            events_in_total: eventsInTotal,
            events_out_total: eventsOutTotal,
            avg_memory: memory,
            avg_memory_used: memoryUsed,
            max_uptime: maxUptime
          }
        };
      });
    });
  };
};
