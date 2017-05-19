import Joi from 'joi';
import { getAllStats } from '../../../../lib/phone_home/get_all_stats';
import handleError from '../../../../lib/handle_error';

export default function phoneHomeRoutes(server) {
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('monitoring');

  /**
   * This endpoint is ONLY for development and internal testing.
   */
  server.route({
    path: '/api/monitoring/v1/phone-home',
    method: 'POST',
    handler: (req, reply) => {
      // Change to true to test indexing the data. Note, user must have privileges
      // NOTE: IF YOU DISABLED THE UI, YOU MUST RE-ENABLE IT OR THE ABOVE CLIENT IS NOT CONFIGURED
      if (false) {
        const body = req.payload;
        const options = {
          index: '.monitoring',
          type: 'phone_home',
          body: body
        };

        callWithRequest(req, 'index', options)
        .then(reply)
        .catch(err => reply(handleError(err, req)));
      } else {
        reply({});
      }
    }
  });

  /**
   * Phone Home Data Gathering
   *
   * This provides a mechanism for fetching minor details about all clusters, including details related to the rest of the
   * stack (e.g., Kibana).
   */
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/_stats',
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
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;

      return getAllStats(req, start, end)
      .then(reply)
      .catch(() => {
        // ignore errors, return empty set and a 200
        reply([]).code(200);
      });
    }
  });
};
