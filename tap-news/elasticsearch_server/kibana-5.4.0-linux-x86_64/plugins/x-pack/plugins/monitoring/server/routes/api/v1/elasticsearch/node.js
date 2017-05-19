import _ from 'lodash';
import Promise from 'bluebird';
import Joi from 'joi';
import getClusterStatus from '../../../../lib/get_cluster_status';
import getNodeSummary from '../../../../lib/get_node_summary';
import getMetrics from '../../../../lib/details/get_metrics';
import getShardStats from '../../../../lib/get_shard_stats';
import getShardAllocation from '../../../../lib/get_shard_allocation';
import calculateIndices from '../../../../lib/calculate_indices';
import calculateClusterShards from '../../../../lib/elasticsearch/calculate_cluster_shards';
import calculateNodeType from '../../../../lib/calculate_node_type';
import getLastState from '../../../../lib/get_last_state';
import getDefaultNodeFromId from '../../../../lib/get_default_node_from_id';
import lookups from '../../../../lib/lookups';
import handleError from '../../../../lib/handle_error';

export default function nodeRoutes(server) {
  const config = server.config();
  const esIndexPattern = config.get('xpack.monitoring.elasticsearch.index_pattern');

  function getNodeTypeClassLabel(node) {
    const nodeType = (node.master && 'master') || node.type;
    const typeClassLabel = {
      nodeType,
      nodeTypeLabel: _.get(lookups, `nodeTypeLabel['${nodeType}']`),
      nodeTypeClass: _.get(lookups, `nodeTypeClass['${nodeType}']`)
    };
    return typeClassLabel;
  }

  server.route({
    method: 'POST',
    path: '/api/monitoring/v1/clusters/{clusterUuid}/elasticsearch/nodes/{resolver}',
    config: {
      validate: {
        params: Joi.object({
          clusterUuid: Joi.string().required(),
          resolver: Joi.string().required()
        }),
        payload: Joi.object({
          showSystemIndices: Joi.boolean().default(false), // show/hide system indices in shard allocation table
          timeRange: Joi.object({
            min: Joi.date().required(),
            max: Joi.date().required()
          }).required(),
          metrics: Joi.array().required(),
          shards: Joi.boolean().default(true)
        })
      }
    },
    handler: (req, reply) => {
      const resolver = req.params.resolver;
      const start = req.payload.timeRange.min;
      const end = req.payload.timeRange.max;
      const showSystemIndices = req.payload.showSystemIndices;
      const collectShards = req.payload.shards;
      calculateIndices(req, start, end, esIndexPattern)
      .then(indices => {
        return getLastState(req, indices)
        .then(lastState => {
          const configResolver = `source_node.${config.get('xpack.monitoring.node_resolver')}`;
          let shards;
          if (collectShards) {
            shards = getShardAllocation(req, indices, [{ term: { [configResolver]: resolver } }], lastState, showSystemIndices);
          }
          return Promise.props({
            clusterStatus: getClusterStatus(req, indices, lastState),
            nodeSummary: getNodeSummary(req, indices),
            metrics: getMetrics(req, indices, [{ term: { [configResolver]: resolver } }]),
            shards,
            shardStats: getShardStats(req, indices, lastState),
            nodes: {},
            clusterState: lastState
          });
        });
      })
      .then(calculateClusterShards)
      .then(body => {
        const clusterState = body.clusterState && body.clusterState.cluster_state || { nodes: {} };
        let nodeDetail = body.nodeSummary.node;
        if (!nodeDetail) {
          // workaround for node indexed with legacy agent
          nodeDetail = getDefaultNodeFromId(resolver);
        }
        nodeDetail.type = calculateNodeType(nodeDetail, clusterState);
        body.nodes[resolver] = nodeDetail;

        // set type for labeling / iconography
        const { nodeType, nodeTypeLabel, nodeTypeClass } = getNodeTypeClassLabel(nodeDetail);
        nodeDetail.type = nodeType;
        nodeDetail.nodeTypeLabel = nodeTypeLabel;
        nodeDetail.nodeTypeClass = nodeTypeClass;

        body.nodeSummary.totalShards = _.get(body, `shardStats.nodes['${resolver}'].shardCount`);
        body.nodeSummary.indexCount = _.get(body, `shardStats.nodes['${resolver}'].indexCount`);

        // combine data from different sources into 1 object
        body.nodeSummary = _.merge(body.nodeSummary, nodeDetail);

        body.nodeSummary.status = 'Online';
        // If this node is down
        if (!clusterState.nodes[body.nodeSummary.resolver]) {
          body.nodeSummary.documents = 'N/A';
          body.nodeSummary.dataSize = 'N/A';
          body.nodeSummary.freeSpace = 'N/A';
          body.nodeSummary.documents = 'N/A';
          body.nodeSummary.indexCount = 'N/A';
          body.nodeSummary.totalShards = 'N/A';
          body.nodeSummary.status = 'Offline';
        }
        delete body.clusterState;
        return body;
      })
      .then(reply)
      .catch(err => reply(handleError(err, req)));
    }
  });

};
