import { get, merge, set } from 'lodash';
import elasticsearchVersionMismatch from './watches/elasticsearch_version_mismatch';
import elasticsearchClusterStatus from './watches/elasticsearch_cluster_status';
import kibanaVersionMismatch from './watches/kibana_version_mismatch';
import logstashVersionMismatch from './watches/logstash_version_mismatch';

export const alertIndexFields = [
  'metadata.xpack.alert_index',
  'input.chain.inputs[1].alert.search.request.indices[0]',
  'actions.trigger_alert.index.index'
];

/**
 * All alerts are per-cluster, which means that they need to have unique names when they are added to the Monitoring cluster.
 *
 * The expected pattern is to prefix each Watch's key name with the {@code cluster_uuid} of the current cluster.
 */
export const alerts = [
  elasticsearchClusterStatus,
  elasticsearchVersionMismatch,
  kibanaVersionMismatch,
  logstashVersionMismatch
];

/**
 * Copy the stored {@code alerts} IDs and replace any placeholders with the cluster's UUID.
 *
 * @param {String} clusterUuid The Cluster UUID to replace.
 * @returns {Array} An array of string IDs representing each Watch.
 */
export function watchIdsForCluster(clusterUuid) {
  // fetch IDs for all alerts
  return alerts.map(alert => get(alert.watch, alert.id).replace('{{cluster_uuid}}', clusterUuid));
}

/**
 * Copy the stored {@code alerts} and replace any placeholders with the cluster's UUID.
 *
 * Each object in the resulting array contains an {@code id}, {@code version}, and {@code watch} field. The Watch can be
 * used to send directly to Watcher with the specified ID.
 *
 * @param {String} alertIndex The alerts index (.monitoring-alerts-N)
 * @param {String} clusterUuid The Cluster UUID to replace.
 * @param {String} version The version of the plugin creating the watches.
 * @returns {Array} An array of objects representing the watches to be used for the current cluster.
 */
export function createWatchesForCluster(alertIndex, clusterUuid, version) {
  // replace any value that needs the cluster UUID with the passed in value
  return alerts.map(alert => {
    // clone the existing object (so we don't mutate the original)
    // also tag the version that the Watch was created from (so we can later decide to replace it if we want)
    const watchWithUuid = merge({ metadata: { xpack: { version } } }, alert.watch);

    // plug in the {{alert_index}}
    for (const key of alertIndexFields) {
      set(watchWithUuid, key, alertIndex);
    }

    // plug in the {{cluster_uuid}}
    for (const key of alert.cluster_uuid_fields) {
      set(watchWithUuid, key, get(watchWithUuid, key).replace('{{cluster_uuid}}', clusterUuid));
    }

    return {
      id: get(watchWithUuid, alert.id),
      version,
      watch: watchWithUuid
    };
  });
}
