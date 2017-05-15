import Joi from 'joi';
import Promise from 'bluebird';
import getKibanaInfo from '../../../../lib/get_kibana_info';
import handleError from '../../../../lib/handle_error';
import getMetrics from '../../../../lib/details/get_metrics';
import calculateIndices from '../../../../lib/calculate_indices';

/*
 * Kibana Instance route.
 */
export default function kibanaInstanceRoutes(server) {
  const config = server.config();
  const kbnIndexPattern = config.get('xpack.monitoring.kibana.index_pattern');

  /*
   * Kibana instance
   *
   * This will fetch all data required to display a Kibana instance's page.
   *
   * The current details returned are:
   *
   * - Kibana Instance Summary (Status)
   * - Metrics
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/kibana/{kibanaUuid}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          kibanaUuid: Joi.string().required()
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
      return calculateIndices(req, start, end, kbnIndexPattern)
      .then(kibanaIndices => {
        return Promise.props({
          metrics: getMetrics(req, kibanaIndices),
          kibanaSummary: getKibanaInfo(req, req.params.kibanaUuid)
        });
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
