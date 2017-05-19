import { map } from 'lodash';
import moment from 'moment';
import checkMonitoringAuth from './check_monitoring_auth';

/**
 * Calls the _fieldStats API on a given index pattern.
 */
export default async function calculateIndices(req, start, end, indexPattern) {
  // Tests access to the monitoring data index. Throws if there is a 401
  await checkMonitoringAuth(req, indexPattern);

  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const countResults = await callWithRequest(req, 'count', {
    index: indexPattern,
    ignore: [404]
  });

  if (countResults.status === 404) {
    // no relevant indices exist for the index pattern
    return [];
  }

  // get the set of indices with data for the time range
  const options = {
    index: indexPattern,
    level: 'indices',
    ignoreUnavailable: true,
    body: {
      fields: ['timestamp'],
      index_constraints: {
        timestamp: {
          max_value: { gte: moment.utc(start).toISOString() },
          min_value: { lte: moment.utc(end).toISOString() }
        }
      }
    }
  };
  const resp = await callWithRequest(req, 'fieldStats', options);

  // note: the index patterns are setup so that there is no overlap (`.monitoring-data-N` versus `.monitoring-{product}-N-*`)
  return map(resp.indices, (_info, index) => index);
};
