import Joi from 'joi';
import { getClustersFromRequest } from '../../../../lib/get_clusters_from_request';
import handleError from '../../../../lib/handle_error';

export default function clustersRoutes(server) {
  /*
   * Monitoring Home
   * Route Init (for checking license and compatibility for multi-cluster monitoring
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters',
    config: {
      validate: {
        payload: Joi.object({
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required()
        })
      }
    },
    handler: (req, reply) => {
      return getClustersFromRequest(req)
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });
};
