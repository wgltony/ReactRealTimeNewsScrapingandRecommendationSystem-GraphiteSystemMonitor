import Joi from 'joi';
import Promise from 'bluebird';
import { get } from 'lodash';
import getKibanas from '../../../../lib/lists/get_kibanas';
import getKibanasForClusters from '../../../../lib/get_kibanas_for_clusters';
import handleError from '../../../../lib/handle_error';
import getMetrics from '../../../../lib/details/get_metrics';
import calculateIndices from '../../../../lib/calculate_indices';

const getClusterStatus = function (req, kibanaIndices) {
  const getKibanaForCluster = getKibanasForClusters(req, kibanaIndices);
  return getKibanaForCluster([{ cluster_uuid: req.params.clusterUuid }])
  .then(clusterStatus => get(clusterStatus, '[0].stats'));
};

/*
 * Kibana routes
 */
export default function kibanaInstancesRoutes(server) {
  const config = server.config();
  const kbnIndexPattern = config.get('xpack.monitoring.kibana.index_pattern');

  /**
   * Kibana overview and listing
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/kibana',
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
          metrics: Joi.array().optional(),
          instances: Joi.boolean().default(true)
        })
      }
    },
    handler: (req, reply) => {
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      return calculateIndices(req, start, end, kbnIndexPattern)
      .then(kibanaIndices => {
        return Promise.props({
          metrics: req.payload.metrics ? getMetrics(req, kibanaIndices) : {},
          kibanas: req.payload.instances ? getKibanas(req, kibanaIndices) : [],
          clusterStatus: getClusterStatus(req, kibanaIndices)
        });
      })
      .then (reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
