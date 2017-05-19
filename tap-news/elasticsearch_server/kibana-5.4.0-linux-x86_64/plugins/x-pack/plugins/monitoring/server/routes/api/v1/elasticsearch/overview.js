import Promise from 'bluebird';
import Joi from 'joi';
import getLastRecovery from '../../../../lib/get_last_recovery';
import calculateIndices from '../../../../lib/calculate_indices';
import getLastState from '../../../../lib/get_last_state';
import getClusterStatus from '../../../../lib/get_cluster_status';
import getMetrics from '../../../../lib/details/get_metrics';
import getShardStats from '../../../../lib/get_shard_stats';
import calculateClusterShards from '../../../../lib/elasticsearch/calculate_cluster_shards';

// manipulate cluster status and license meta data
export default function clustersRoutes(server) {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

  /**
   * Elasticsearch Overview
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      calculateIndices(req, start, end, esIndexPattern)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            metrics: getMetrics(req, indices),
            shardStats: getShardStats(req, indices, lastState),
            shardActivity: getLastRecovery(req, indices)
          });
        });
      })
      .then(calculateClusterShards)
      .then(reply)
      .catch(() => reply([]));
    }
  });
};
