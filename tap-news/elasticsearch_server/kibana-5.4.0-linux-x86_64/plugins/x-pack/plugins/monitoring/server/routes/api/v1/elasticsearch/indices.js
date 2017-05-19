import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import calculateIndices from '../../../../lib/calculate_indices';
import getLastState from '../../../../lib/get_last_state';
import getClusterStatus from '../../../../lib/get_cluster_status';
import getListing from '../../../../lib/lists/get_indices';
import getShardStats from '../../../../lib/get_shard_stats';
import getUnassignedShards from '../../../../lib/get_unassigned_shards';
import calculateClusterShards from '../../../../lib/elasticsearch/calculate_cluster_shards';
import handleError from '../../../../lib/handle_error';

export default function indicesRoutes(server) {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/indices',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          showSystemIndices: Joi.boolean().default(false), // show/hide indices in listing
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          listingMetrics: Joi.array().required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      const showSystemIndices = req.payload.showSystemIndices;

      calculateIndices(req, start, end, esIndexPattern)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            rows: getListing(req, indices, showSystemIndices),
            shardStats: getShardStats(req, indices, lastState)
          });
        });
      })
      // Add the index status to each index from the shardStats
      .then((body) => {
        body.rows.forEach((row) => {
          if (body.shardStats[row.name]) {
            row.status = body.shardStats[row.name].status;
            // column for a metric that is calculated in code vs. calculated in a query
            // it's not given in req.payload.listingMetrics
            _.merge(row, getUnassignedShards(body.shardStats[row.name]));
          } else {
            row.status = 'Unknown';
            _.set(row, 'metrics.index_document_count.inapplicable', true);
            _.set(row, 'metrics.index_size.inapplicable', true);
            _.set(row, 'metrics.index_search_request_rate.inapplicable', true);
            _.set(row, 'metrics.index_request_rate.inapplicable', true);
            _.set(row, 'metrics.index_unassigned_shards.inapplicable', true);
          }
        });
        return body;
      })
      // Send the response
      .then(calculateClusterShards)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
