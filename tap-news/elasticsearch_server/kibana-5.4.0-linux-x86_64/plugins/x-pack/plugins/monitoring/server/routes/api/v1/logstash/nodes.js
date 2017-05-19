import Joi from 'joi';
import Promise from 'bluebird';
import getClusterStatus from '../../../../lib/logstash/get_cluster_status';
import getNodes from '../../../../lib/logstash/get_nodes';
import handleError from '../../../../lib/handle_error';
import calculateIndices from '../../../../lib/calculate_indices';

/*
 * Logstash Nodes route.
 */
export default function logstashNodesRoute(server) {
  const config = server.config();
  const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');

  /**
   * Logtash Nodes request.
   *
   * This will fetch all data required to display the Logstash Nodes page.
   *
   * The current details returned are:
   *
   * - Logstash Cluster Status
   * - Nodes list
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/logstash/nodes',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        }),
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      return calculateIndices(req, start, end, logstashIndexPattern)
      .then(logstashIndices => {
        return Promise.props({
          nodes: getNodes(req, logstashIndices),
          clusterStatus: getClusterStatus(req, logstashIndices, 'route-node-listing')
        });
      })
      .then (reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

};
