import _ from 'lodash';
import Promise from 'bluebird';

/*
 * @param req: server's request object
 * @return array of cluster objects with .stats field added
 */
export default function getClustersStats(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();

  return (clusters) => {
    // in case getClusters had no hits and returned undefined
    if (!clusters) return [];

    return Promise.map(clusters, (cluster) => {
      const body = {
        size: 1,
        sort: [ { timestamp: 'desc' } ],
        query: { bool: { filter: {
          term: { cluster_uuid: cluster.cluster_uuid }
        } } }
      };
      const params = {
        index: config.get('xpack.monitoring.elasticsearch.index_pattern'),
        ignore: [404],
        type: 'cluster_stats',
        body: body
      };

      return callWithRequest(req, 'search', params)
        .then((resp) => {
          if (resp.hits.total) {
            cluster.stats = _.get(resp.hits.hits[0], '_source.cluster_stats');
          }
          return cluster;
        });
    });
  };
};
