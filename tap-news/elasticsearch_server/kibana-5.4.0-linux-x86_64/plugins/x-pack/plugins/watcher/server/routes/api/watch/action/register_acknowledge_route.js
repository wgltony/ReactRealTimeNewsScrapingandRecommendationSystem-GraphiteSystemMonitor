import { get } from 'lodash';
import { callWithRequestFactory } from '../../../../lib/call_with_request_factory';
import { WatchStatus } from '../../../../models/watch_status';
import { licensePreRoutingFactory } from'../../../../lib/license_pre_routing_factory';

export function registerAcknowledgeRoute(server) {
  const licensePreRouting = licensePreRoutingFactory(server);

  server.route({
    path: '/api/watcher/watch/{watchId}/action/{actionId}/acknowledge',
    method: 'PUT',
    handler: (request, reply) => {
      const callWithRequest = callWithRequestFactory(server, request);
      const { watchId, actionId } = request.params;

      return acknowledgeAction(callWithRequest, watchId, actionId)
      .then(hit => {
        const watchStatusJson = get(hit, '_status');
        const json = {
          id: watchId,
          watchStatusJson: watchStatusJson
        };

        const watchStatus = WatchStatus.fromUpstreamJSON(json);
        reply({ watchStatus: watchStatus.downstreamJSON });
      });
    },
    config: {
      pre: [ licensePreRouting ]
    }
  });
}

function acknowledgeAction(callWithRequest, watchId, actionId) {
  return callWithRequest('watcher.ackWatch', {
    id: watchId,
    action: actionId
  });
}
