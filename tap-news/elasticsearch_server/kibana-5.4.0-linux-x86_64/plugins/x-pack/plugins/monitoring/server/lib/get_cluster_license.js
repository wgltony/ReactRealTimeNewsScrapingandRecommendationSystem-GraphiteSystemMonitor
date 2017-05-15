import { get } from 'lodash';

export default function getClusterLicense(req, clusterUuid) {
  const config = req.server.config();
  const clusterCheckParams = {
    index: config.get('xpack.monitoring.index'),
    type: 'cluster_info',
    id: clusterUuid,
    _source: ['license']
  };

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  return callWithRequest(req, 'get', clusterCheckParams)
  .then(response => {
    const license = response._source.license;
    return Object.assign(
      {},
      license,
      { active: get(license, 'status') === 'active' }
    );
  });
}
