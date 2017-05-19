/**
 * Shared functionality between the different routes.
 */
import { get } from 'lodash';
import getLogstashForClusters from './get_logstash_for_clusters';

/**
 * Get the cluster status for Logstash instances.
 *
 * The cluster status should only be displayed on cluster-wide pages. Individual Logstash nodes should show the node's status only.
 *
 * @param req {Object} The incoming request.
 * @param logstashIndices {Array} The Logstash indices to query for the current time range.
 * @returns The cluster status object.
 */
export default function getClusterStatus(req, logstashIndices) {
  const getLogstashForCluster = getLogstashForClusters(req, logstashIndices);
  return getLogstashForCluster([{ cluster_uuid: req.params.clusterUuid }])
  .then(clusterStatus => get(clusterStatus, '[0].stats'));
}
