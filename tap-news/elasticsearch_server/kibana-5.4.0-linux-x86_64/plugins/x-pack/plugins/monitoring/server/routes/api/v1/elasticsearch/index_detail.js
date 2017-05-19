import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import calculateIndices from '../../../../lib/calculate_indices';
import getLastState from '../../../../lib/get_last_state';
import getClusterStatus from '../../../../lib/get_cluster_status';
import getIndexSummary from '../../../../lib/get_index_summary';
import getMetrics from '../../../../lib/details/get_metrics';
import getShardStats from '../../../../lib/get_shard_stats';
import getShardAllocation from '../../../../lib/get_shard_allocation';
import calculateClusterShards from '../../../../lib/elasticsearch/calculate_cluster_shards';
import handleError from '../../../../lib/handle_error';

export default function indexRoutes(server) {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/indices/{id}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          id: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required(),
          shards: Joi.boolean().default(true)
        })
      }
    },
    handler: (req, reply) => {
      const id = req.params.id;
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      const collectShards = req.payload.shards;
      calculateIndices(req, start, end, esIndexPattern)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          const showSystemIndices = true; // hardcode to true, because this could be a system index
          let shards;
          if (collectShards) {
            shards = getShardAllocation(req, indices, [{ term: { 'shard.index': id } }], lastState, showSystemIndices);
          }
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            indexSummary:  getIndexSummary(req, indices),
            metrics: getMetrics(req, indices, [{ term: { 'index_stats.index': id } }]),
            shards,
            shardStats: getShardStats(req, indices, lastState),
            lastState: lastState
          });
        });
      })
      .then(calculateClusterShards)
      .then(function (body) {
        const shardStats = body.shardStats[id];
        // check if we need a legacy workaround for Monitoring 2.0 node data
        if (shardStats) {
          body.indexSummary.unassignedShards = shardStats.unassigned.primary + shardStats.unassigned.replica;
          body.indexSummary.totalShards = shardStats.primary + shardStats.replica + body.indexSummary.unassignedShards;
          body.indexSummary.status = shardStats.status;
          body.indexSummary.shardStats = shardStats;
        } else {
          body.indexSummary.status = 'Not Available';
          body.indexSummary.totalShards = 'N/A';
          body.indexSummary.unassignedShards = 'N/A';
          body.indexSummary.documents = 'N/A';
          body.indexSummary.dataSize = 'N/A';
        }
        const shardNodes = _.get(body, 'shardStats.nodes');
        body.nodes = {};
        _.forEach(shardNodes, (shardNode, resolver) => {
          body.nodes[resolver] = shardNode;
        });
        delete body.lastState;
        return body;
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

};
