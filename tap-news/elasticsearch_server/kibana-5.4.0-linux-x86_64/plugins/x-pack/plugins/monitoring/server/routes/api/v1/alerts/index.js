import Joi from 'joi';
import alertsClusterSearch from '../../../../cluster_alerts/alerts_cluster_search';
import { checkLicense } from '../../../../cluster_alerts/check_license';
import getClusterLicense from '../../../../lib/get_cluster_license';

/*
 * Cluster Alerts route.
 */
export default function clusterAlertsRoute(server) {
  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/alerts',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required()
        })
      }
    },
    handler(req, reply) {
      const clusterUuid = req.params.clusterUuid;
      return alertsClusterSearch(req, clusterUuid, getClusterLicense, checkLicense)
      .then(reply);
    }
  });
};
