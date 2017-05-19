import opsBuffer from './lib/ops_buffer';
import { get } from 'lodash';

export default function (serverInfo, server) {
  const config = server.config();
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
  callWithInternalUser('transport.request', {
    method: 'GET',
    path: '/_xpack'
  }).then((res) => {
    const isEnabledInAdminCluster = !!get(res, 'features.monitoring.enabled');
    if (isEnabledInAdminCluster) {
      const buffer = opsBuffer(serverInfo, server);
      const monitor = server.plugins['even-better'].monitor;
      let opsHandler;

      function onOps(event) {
        buffer.push(event);
      }

      server.plugins.elasticsearch.status.on('green', () => {
        monitor.on('ops', onOps);
        opsHandler = setInterval(() => buffer.flush(), config.get('xpack.monitoring.kibana.collection.interval'));
      });

      server.plugins.elasticsearch.status.on('red', () => {
        monitor.removeListener('ops', onOps);
        clearInterval(opsHandler);
      });
    }
  }).catch(() => {
    const monitoringTag = config.get('xpack.monitoring.loggingTag');
    server.log(['warning', monitoringTag], 'Unable to retrieve X-Pack info. Kibana monitoring will be disabled.');
  });
}
