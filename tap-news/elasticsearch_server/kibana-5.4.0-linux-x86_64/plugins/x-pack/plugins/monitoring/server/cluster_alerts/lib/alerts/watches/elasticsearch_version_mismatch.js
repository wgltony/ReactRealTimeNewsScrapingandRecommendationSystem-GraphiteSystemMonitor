const elasticsearchVersionMismatch = {
  cluster_uuid_fields: [
    'metadata.name',
    'metadata.xpack.cluster_uuid',
    'input.chain.inputs[0].check.search.request.body.query.bool.filter.term._id',
    'input.chain.inputs[1].alert.search.request.body.query.bool.filter.term._id',
    'actions.trigger_alert.index.doc_id'
  ],
  id: 'actions.trigger_alert.index.doc_id',
  watch: {
    metadata: {
      name: 'X-Pack Monitoring: Elasticsearch Version Mismatch ({{cluster_uuid}})',
      xpack: {
        alert_index: '{{alert_index}}',
        cluster_uuid: '{{cluster_uuid}}',
        link: 'elasticsearch/nodes',
        severity: 1000,
        type: 'monitoring',
        watch: 'elasticsearch_version_mismatch'
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
                    '.monitoring-data-2'
                  ],
                  types: [
                    'cluster_info'
                  ],
                  body: {
                    size: 1,
                    terminate_after: 1,
                    _source: [
                      'cluster_stats.nodes.versions'
                    ],
                    query: {
                      bool: {
                        filter: {
                          term: {
                            _id: '{{cluster_uuid}}'
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
                            _id: '{{cluster_uuid}}_elasticsearch_version_mismatch'
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
`ctx.vars.fails_check =
  ctx.payload.check.hits.total != 0 && ctx.payload.check.hits.hits[0]._source.cluster_stats.nodes.versions.size() != 1;
ctx.vars.not_resolved = ctx.payload.alert.hits.total == 1 && ctx.payload.alert.hits.hits[0]._source.resolved_timestamp == null;
return ctx.vars.fails_check || ctx.vars.not_resolved;`
        )
      }
    },
    transform: {
      script: {
        inline: (
`def versionMessage = null;
if (ctx.vars.fails_check) {
  def versions = new ArrayList(ctx.payload.check.hits.hits[0]._source.cluster_stats.nodes.versions);
  Collections.sort(versions);
  versionMessage = 'Versions: [' + String.join(', ', versions) + '].';
}
if (ctx.vars.not_resolved) {
  ctx.payload = ctx.payload.alert.hits.hits[0]._source;
  if (ctx.vars.fails_check) {
    ctx.payload.message = versionMessage;
  } else {
    ctx.payload.resolved_timestamp = ctx.execution_time;
  }
} else {
  ctx.payload = [
    'timestamp': ctx.execution_time,
    'prefix': 'This cluster is running with multiple versions of Elasticsearch.',
    'message': versionMessage,
    'metadata': ctx.metadata.xpack
  ];
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
          doc_id: '{{cluster_uuid}}_elasticsearch_version_mismatch'
        }
      }
    }
  }
};

export default elasticsearchVersionMismatch;
