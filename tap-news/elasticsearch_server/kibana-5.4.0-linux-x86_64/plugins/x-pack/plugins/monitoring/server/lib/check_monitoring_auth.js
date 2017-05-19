/* Check "read" privileges on monitoring-*. If authentication doesn't have
 * privilege to view monitoring data, then this throws */
export default function checkMonitoringAuth(req) {
  const { callWithRequest } = req.server.plugins.elasticsearch.getCluster('monitoring');
  const config = req.server.config();

  return callWithRequest(req, 'count', {
    index: config.get('xpack.monitoring.index'),
    ignore: [404]
  });
};
