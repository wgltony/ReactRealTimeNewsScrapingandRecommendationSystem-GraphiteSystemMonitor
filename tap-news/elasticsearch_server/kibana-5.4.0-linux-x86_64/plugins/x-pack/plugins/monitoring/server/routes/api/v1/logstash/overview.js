import Joi from 'joi';
import Promise from 'bluebird';
import handleError from '../../../../lib/handle_error';
import getClusterStatus from '../../../../lib/logstash/get_cluster_status';
import getMetrics from '../../../../lib/details/get_metrics';
import calculateIndices from '../../../../lib/calculate_indices';

/*
 * Logstash Overview route.
 */
export default function logstashOverviewRoute(server) {
  const config = server.config();
  const logstashIndexPattern = config.get('xpack.monitoring.logstash.index_pattern');

  /**
   * Logstash Overview request.
   *
   * This will fetch all data required to display the Logstash Overview page.
   *
   * The current details returned are:
   *
   * - Logstash Cluster Status
   * - Metrics
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/logstash',
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
      return calculateIndices(req, start, end, logstashIndexPattern)
      .then(logstashIndices => {
        return Promise.props({
          metrics: getMetrics(req, logstashIndices),
          clusterStatus: getClusterStatus(req, logstashIndices, 'route-logstash-overview')
        });
      })
      .then (reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
