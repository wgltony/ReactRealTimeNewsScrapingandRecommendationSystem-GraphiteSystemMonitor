import { once } from 'lodash';
import esShield from './elasticsearch-shield-js/elasticsearch-shield';

export default once((server) => {
  const config = Object.assign({ plugins: [esShield] }, server.config().get('elasticsearch'));
  const cluster = server.plugins.elasticsearch.createCluster('security', config);

  return cluster;
});
