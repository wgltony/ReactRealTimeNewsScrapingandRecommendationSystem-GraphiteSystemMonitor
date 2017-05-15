const elasticsearchClusterStatus = {
  cluster_uuid_fields: [
    'metadata.name',
    'metadata.xpack.cluster_uuid',
    'input.chain.inputs[0].check.search.request.body.query.bool.filter.term.cluster_uuid',
    'input.chain.inputs[1].alert.search.request.body.query.bool.filter.term._id',
    'actions.trigger_alert.index.doc_id'
  ],
  id: 'actions.trigger_alert.index.doc_id',
  watch: {
    metadata: {
      name: 'X-Pack Monitoring: Cluster Status ({{cluster_uuid}})',
      xpack: {
        alert_index: '{{alert_index}}',
        cluster_uuid: '{{cluster_uuid}}',
        link: 'elasticsearch/indices',
        severity: 2100,
        type: 'monitoring',
        watch: 'elasticsearch_cluster_status'
      }
    },
    trigger: {
      schedule: {
        interval: '1m'
      }
    },
    input: {
      chain: {
        inputs: [
          {
            check: {
              search: {
                request: {
                  indices: [
                    '.monitoring-es-2-*'
                  ],
                  types: [
                    'cluster_state'
                  ],
                  body: {
                    size: 1,
                    sort: [
                      {
                        timestamp: {
                          order: 'desc'
                        }
                      }
                    ],
                    _source: [
                      'cluster_state.status'
                    ],
                    query: {
                      bool: {
                        filter: {
                          term: {
                            cluster_uuid: '{{cluster_uuid}}'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            alert: {
              search: {
                request: {
                  indices: [
                    '{{alert_index}}'
                  ],
                  body: {
                    size: 1,
                    terminate_after: 1,
                    query: {
                      bool: {
                        filter: {
                          term: {
                            _id: '{{cluster_uuid}}_elasticsearch_cluster_status'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        ]
      }
    },
    condition: {
      script: {
        inline: (
`ctx.vars.fails_check = ctx.payload.check.hits.total != 0 && ctx.payload.check.hits.hits[0]._source.cluster_state.status != 'green';
ctx.vars.not_resolved = ctx.payload.alert.hits.total == 1 && ctx.payload.alert.hits.hits[0]._source.resolved_timestamp == null;
return ctx.vars.fails_check || ctx.vars.not_resolved`
        )
      }
    },
    transform: {
      script: {
        inline: (
`def state = 'red';
if (ctx.vars.fails_check) {
  state = ctx.payload.check.hits.hits[0]._source.cluster_state.status;
}
if (ctx.vars.not_resolved) {
  ctx.payload = ctx.payload.alert.hits.hits[0]._source;
  if (ctx.vars.fails_check == false) {
    ctx.payload.resolved_timestamp = ctx.execution_time;
  }
} else {
  ctx.payload = [
    'timestamp': ctx.execution_time,
    'metadata': ctx.metadata.xpack
  ];
}
if (ctx.vars.fails_check) {
  ctx.payload.prefix = 'Elasticsearch cluster status is ' + state + '.';
  if (state == 'red') {
    ctx.payload.message = 'Allocate missing primary shards and replica shards.';
    ctx.payload.metadata.severity = 2100;
  } else {
    ctx.payload.message = 'Allocate missing replica shards.';
    ctx.payload.metadata.severity = 1100;
  }
}
ctx.payload.update_timestamp = ctx.execution_time;
return ctx.payload;`
        )
      }
    },
    actions: {
      trigger_alert: {
        index: {
          index: '{{alert_index}}',
          doc_type: 'doc',
          doc_id: '{{cluster_uuid}}_elasticsearch_cluster_status'
        }
      }
    }
  }
};

export default elasticsearchClusterStatus;
