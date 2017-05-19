import {
  MONITORING_SYSTEM_API_VERSION, KIBANA_SYSTEM_ID, KIBANA_STATS_TYPE
} from '../../../common/constants';
import _ from 'lodash';
import { mapEvent, rollupEvent } from './map_event';
import monitoringBulk from './monitoring_bulk';

export default function opsBuffer(serverInfo, server) {
  const config = server.config();
  const interval = config.get('xpack.monitoring.kibana.collection.interval') + 'ms';
  const monitoringTag = config.get('xpack.monitoring.loggingTag');
  const client = server.plugins.elasticsearch.getCluster('admin').createClient({
    plugins: [monitoringBulk]
  });

  let lastOp = null;

  return {
    push(event) {
      lastOp = {
        host: event.host,
        rollup: rollupEvent(event, lastOp)
      };

      server.log(['debug', monitoringTag], 'Received Monitoring event data');
    },
    flush() {
      if (!lastOp) return;

      // grab the last operation
      const payload = mapEvent(lastOp, config, serverInfo);
      const body = [
        // Push the time-based information to .monitoring-kibana-*
        { index: { _type: KIBANA_STATS_TYPE } },
        payload,
        // Push the latest ops data to .monitoring-data index
        { index: { _index: '_data', _type: KIBANA_SYSTEM_ID, _id: _.get(payload, 'kibana.uuid') } },
        payload
      ];

      // reset lastOp
      lastOp = null;

      server.log(['debug', monitoringTag], 'Sending Monitoring payload to Elasticsearch');

      return client.monitoring.bulk({
        system_id: KIBANA_SYSTEM_ID,
        system_api_version: MONITORING_SYSTEM_API_VERSION,
        interval,
        body
      })
      .catch((err) => {
        server.log(['error', monitoringTag], err);
      });
    }
  };
}
