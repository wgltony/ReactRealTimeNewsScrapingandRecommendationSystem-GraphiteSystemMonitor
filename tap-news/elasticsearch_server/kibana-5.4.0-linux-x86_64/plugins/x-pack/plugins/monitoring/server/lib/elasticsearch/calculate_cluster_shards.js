export default function calculateClusterShards(body) {
  body.clusterStatus.unassignedShards = body.shardStats.totals.unassigned.replica + body.shardStats.totals.unassigned.primary;
  body.clusterStatus.totalShards = body.clusterStatus.totalShards + body.clusterStatus.unassignedShards;
  return body;
};
