import _ from 'lodash';
import calculateAvailability from './calculate_availability';

export function handleResponse(resp) {
  const getSource = key => _.get(resp, `_source.kibana.${key}`);
  const timestamp = getSource('timestamp');
  const kibana = getSource('kibana');
  const availability = { availability: calculateAvailability(timestamp) };
  const freeMemory = { os_memory_free: getSource('os.memory.free_in_bytes') };
  return _.merge(kibana, availability, freeMemory);
}

export default function getKibanaInfo(req, uuid) {
  const config = req.server.config();
  const params = {
    index: config.get('xpack.monitoring.index'),
    ignore: [404],
    type: 'kibana',
    id: uuid
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'get', params)
  .then(handleResponse);
}
