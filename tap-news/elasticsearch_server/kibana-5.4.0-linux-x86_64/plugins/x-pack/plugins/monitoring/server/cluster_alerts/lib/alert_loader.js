import { get, includes } from 'lodash';
import watcherApi from './watcher_api';
import { findClustersForClusterAlerts } from './index_management';
import { WatchManager } from './alerts/watch_manager';

export default function alertLoader(serverInfo, server) {
  const config = server.config();
  const monitoringTag = config.get('xpack.monitoring.loggingTag');
  const client = server.plugins.elasticsearch.getCluster('monitoring').createClient({
    plugins: [ watcherApi ]
  });

  return {
    trigger() {
      const monitoring = server.plugins.monitoring.info.feature('monitoring').getLicenseCheckResults();
      const clusterAlertsEnabled = get(monitoring, 'clusterAlerts.enabled', false);

      if (!clusterAlertsEnabled) {
        server.log(['debug', monitoringTag], 'Cluster Alerts management is disabled.');

        return Promise.resolve();
      }

      server.log(['debug', monitoringTag], 'Cluster Alerts management is enabled.');

      const watchManager = new WatchManager(serverInfo, server, client);

      // find clusters that should use cluster alerts
      return findClustersForClusterAlerts(server, client, { supportsAlerts: true })
      .then(clusterUuids => watchManager.setupWatchesForClusters(clusterUuids))
      .then(clusters => {
        if (includes(clusters, false)) {
          server.log(['error', monitoringTag], 'Failed to verify or setup Cluster Alerts.');
        }
      })
      // find clusters that shouldn't use cluster alerts
      .then(() => findClustersForClusterAlerts(server, client, { supportsAlerts: false }))
      .then(clusterUuids => watchManager.removeWatchesForClusters(clusterUuids))
      .catch(err => {
        server.log(['error', monitoringTag], 'Failed to verify or setup Cluster Alerts.');
        server.log(['error', monitoringTag], err);
      });
    }
  };
}
