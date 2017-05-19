import { get } from 'lodash';
import { verifyMonitoringLicense } from './verify_monitoring_license';

/*
 * @param {Object} req Request object from the API route
 * @param {String} clusterUuid The cluster's UUID
 */
export default function alertsClusterSearch(req, clusterUuid, getClusterLicense, checkLicense, options = {}) {
  const verification = verifyMonitoringLicense(req.server);

  if (!verification.enabled) {
    return Promise.resolve({ message: verification.message });
  }

  const config = req.server.config();
  const size = options.size || config.get('xpack.monitoring.max_bucket_size');

  return getClusterLicense(req, clusterUuid)
  .then(license => {
    const prodLicenseInfo = checkLicense(license.type, license.active, 'production');
    if (prodLicenseInfo.clusterAlerts.enabled) {
      const params = {
        index: config.get('xpack.monitoring.cluster_alerts.index'),
        ignoreUnavailable: true,
        filterPath: 'hits.hits._source',
        body: {
          size,
          query: {
            bool: {
              must_not: [
                {
                  exists: { field: 'resolved_timestamp' }
                }
              ],
              filter: [
                {
                  term: { 'metadata.cluster_uuid': clusterUuid }
                }
              ]
            }
          },
          sort: [
            'metadata.severity',
            'timestamp'
          ]
        }
      };

      const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
      return callWithRequest(req, 'search', params)
      .then((result) => {
        const hits = get(result, 'hits.hits', []);
        const alerts = hits.map((alert) => alert._source);
        return alerts;
      });
    } else {
      return {
        message: prodLicenseInfo.message
      };
    }
  });
}
