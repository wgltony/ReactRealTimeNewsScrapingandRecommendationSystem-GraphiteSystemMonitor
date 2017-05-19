import { once } from 'lodash';
import alertLoader from './lib/alert_loader';

export default function initClusterAlerts(serverInfo, server) {
  const config = server.config();
  if (config.get('xpack.monitoring.cluster_alerts.management.enabled')) {
    const loader = alertLoader(serverInfo, server);
    const loadImmediatelyOnce = once(loader.trigger);
    let poller;

    server.plugins.monitoring.status.on('green', () => {
      const pollFrequencyInMillis = config.get('xpack.monitoring.cluster_alerts.management.interval');
      poller = setInterval(loader.trigger, pollFrequencyInMillis);

      // don't wait 5m (default) to load watches the first time
      loadImmediatelyOnce();
    });

    server.plugins.monitoring.status.on('red', () => {
      clearInterval(poller);
    });
  }
}
