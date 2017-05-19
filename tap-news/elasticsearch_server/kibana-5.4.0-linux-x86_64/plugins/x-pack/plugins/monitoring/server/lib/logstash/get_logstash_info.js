import _ from 'lodash';
import calculateAvailability from './../calculate_availability';

export function handleResponse(resp) {
  const getSource = (key, defaultValue) => _.get(resp, `_source.logstash.${key}`, defaultValue);
  const timestamp = getSource('timestamp');
  const logstash = getSource('logstash');
  const availability = { availability: calculateAvailability(timestamp) };
  const events = { events: getSource('events') };
  const reloads = { reloads: getSource('reloads') };
  const queueType = { queue_type: getSource('queue.type') };
  return _.merge(logstash, availability, events, reloads, queueType);
}

export default function getNodeInfo(req, uuid) {
  const config = req.server.config();
  const params = {
    index: config.get('xpack.monitoring.index'),
    type: 'logstash',
    id: uuid
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'get', params)
  .then(handleResponse);
}
