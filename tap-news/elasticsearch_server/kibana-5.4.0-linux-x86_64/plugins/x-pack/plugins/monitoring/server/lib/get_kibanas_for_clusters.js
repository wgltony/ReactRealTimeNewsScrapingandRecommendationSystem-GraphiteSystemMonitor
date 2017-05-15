/*
 * Get high-level info for Kibanas in a set of clusters
 * The set contains multiple clusters for cluster listing page
 * The set contains single cluster for cluster overview page and cluster status bar

 * Timespan for the data is an interval of time based on calculations of an
 * interval size using the same calculation as determinting bucketSize using
 * the timepicker for a chart

 * Returns, for each cluster,
 *  - number of instances
 *  - combined health
 */
import Promise from 'bluebird';
import _ from 'lodash';
import createQuery from './create_query.js';
import { ElasticsearchMetric } from './metrics/metric_classes';

export default function getKibanasForClusters(req, indices) {
  if (indices.length < 1) return () => Promise.resolve([]);

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;

  return function (clusters) {
    return Promise.map(clusters, cluster => {
      const clusterUuid = cluster.cluster_uuid;
      const metric = ElasticsearchMetric.getMetricFields();
      const params = {
        size: 0,
        index: indices,
        ignoreUnavailable: true,
        type: 'kibana_stats',
        ignore: [404],
        body: {
          query: createQuery({
            start,
            end,
            uuid: clusterUuid,
            metric
          }),
          aggs: {
            kibana_uuids: {
              terms: {
                field: 'kibana_stats.kibana.uuid',
                size: config.get('xpack.monitoring.max_bucket_size')
              },
              aggs: {
                latest_report: {
                  terms: {
                    field: 'kibana_stats.timestamp',
                    size: 1,
                    order: {
                      '_term': 'desc'
                    }
                  },
                  aggs: {
                    response_time_max: {
                      max: {
                        field: 'kibana_stats.response_times.max'
                      }
                    },
                    memory_rss: {
                      max: {
                        field: 'kibana_stats.process.memory.resident_set_size_in_bytes'
                      }
                    },
                    memory_heap_size_limit: {
                      max: {
                        field: 'kibana_stats.process.memory.heap.size_limit'
                      }
                    },
                    concurrent_connections: {
                      max: {
                        field: 'kibana_stats.concurrent_connections'
                      }
                    },
                    requests_total: {
                      max: {
                        field: 'kibana_stats.requests.total'
                      }
                    }
                  }
                },
                response_time_max_per: {
                  max_bucket: {
                    buckets_path: 'latest_report>response_time_max'
                  }
                },
                memory_rss_per: {
                  max_bucket: {
                    buckets_path: 'latest_report>memory_rss'
                  }
                },
                memory_heap_size_limit_per: {
                  max_bucket: {
                    buckets_path: 'latest_report>memory_heap_size_limit'
                  }
                },
                concurrent_connections_per: {
                  max_bucket: {
                    buckets_path: 'latest_report>concurrent_connections'
                  }
                },
                requests_total_per: {
                  max_bucket: {
                    buckets_path: 'latest_report>requests_total'
                  }
                }
              }
            },
            response_time_max: {
              max_bucket: {
                buckets_path: 'kibana_uuids>response_time_max_per'
              }
            },
            memory_rss: {
              sum_bucket: {
                buckets_path: 'kibana_uuids>memory_rss_per'
              }
            },
            memory_heap_size_limit: {
              sum_bucket: {
                buckets_path: 'kibana_uuids>memory_heap_size_limit_per'
              }
            },
            concurrent_connections: {
              sum_bucket: {
                buckets_path: 'kibana_uuids>concurrent_connections_per'
              }
            },
            requests_total: {
              sum_bucket: {
                buckets_path: 'kibana_uuids>requests_total_per'
              }
            },
            status: {
              terms: {
                field: 'kibana_stats.kibana.status',
                order: {
                  max_timestamp: 'desc'
                }
              },
              aggs: {
                max_timestamp: {
                  max: {
                    field: 'timestamp'
                  }
                }
              }
            }
          }
        }
      };

      return callWithRequest(req, 'search', params)
      .then(result => {
        const getResultAgg = key => _.get(result, `aggregations.${key}`);
        const kibanaUuids =  getResultAgg('kibana_uuids.buckets');
        const statusBuckets = getResultAgg('status.buckets');

        // everything is initialized such that it won't impact any rollup
        let status = null;
        let requestsTotal = 0;
        let connections = 0;
        let responseTime = 0;
        let memorySize = 0;
        let memoryLimit = 0;

        // if the cluster has kibana instances at all
        if (kibanaUuids.length) {
          // get instance status by finding the latest status bucket
          const latestTimestamp = _.chain(statusBuckets).map(bucket => bucket.max_timestamp.value).max().value();
          const latestBucket = _.find(statusBuckets, (bucket) => bucket.max_timestamp.value === latestTimestamp);
          status = _.get(latestBucket, 'key');

          requestsTotal = getResultAgg('requests_total.value');
          connections = getResultAgg('concurrent_connections.value');
          responseTime = getResultAgg('response_time_max.value');
          memorySize = getResultAgg('memory_rss.value'); // resident set size
          memoryLimit = getResultAgg('memory_heap_size_limit.value'); // max old space
        }

        return {
          clusterUuid,
          stats: {
            status,
            requests_total: requestsTotal,
            concurrent_connections: connections,
            response_time_max: responseTime,
            memory_size: memorySize,
            memory_limit: memoryLimit,
            count: kibanaUuids.length
          }
        };
      });
    });
  };
};
