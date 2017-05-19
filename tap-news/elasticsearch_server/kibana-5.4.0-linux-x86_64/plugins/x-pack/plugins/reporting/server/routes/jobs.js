import boom from 'boom';
import { has } from 'lodash';
import { constants } from '../lib/constants';
import { jobsQueryFactory } from '../lib/jobs_query';
import { licensePreRoutingFactory } from'../lib/license_pre_routing';
import { userPreRoutingFactory } from '../lib/user_pre_routing';
import { jobResponseHandlerFactory } from '../lib/job_response_handler';

const mainEntry = `${constants.API_BASE_URL}/jobs`;
const API_TAG = 'api';

export function jobs(server) {
  const config = server.config();
  const socketTimeout = config.get('xpack.reporting.generate.socketTimeout');
  const jobsQuery = jobsQueryFactory(server);
  const licensePreRouting = licensePreRoutingFactory(server);
  const userPreRouting = userPreRoutingFactory(server);
  const jobResponseHandler = jobResponseHandlerFactory(server);

  // list jobs in the queue, paginated
  server.route({
    path: `${mainEntry}/list`,
    method: 'GET',
    handler: (request, reply) => {
      const page = parseInt(request.query.page) || 0;
      const size = Math.min(100, parseInt(request.query.size) || 10);

      const results = jobsQuery.list(request, page, size);
      reply(results);
    },
    config: {
      pre: [ licensePreRouting ],
    }
  });

  // list all completed jobs since a specified time
  server.route({
    path: `${mainEntry}/list_completed_since`,
    method: 'GET',
    handler: (request, reply) => {
      const size = Math.min(100, parseInt(request.query.size) || 10);
      const sinceInMs = Date.parse(request.query.since) || null;

      const results = jobsQuery.listCompletedSince(request, size, sinceInMs);
      reply(results);
    },
    config: {
      pre: [ licensePreRouting ],
    }
  });

  // return the count of all jobs in the queue
  server.route({
    path: `${mainEntry}/count`,
    method: 'GET',
    handler: (request, reply) => {
      const results = jobsQuery.count(request);
      reply(results);
    },
    config: {
      pre: [ licensePreRouting ],
    }
  });

  // return the raw output from a job
  server.route({
    path: `${mainEntry}/output/{docId}`,
    method: 'GET',
    handler: (request, reply) => {
      const { docId } = request.params;

      jobsQuery.get(request, docId, { includeContent: true })
      .then((doc) => {
        if (!doc) return reply(boom.notFound());
        reply(doc._source.output);
      });
    },
    config: {
      pre: [ licensePreRouting ],
      timeout: { socket: socketTimeout },
    }
  });

  // trigger a download of the output from a job
  server.route({
    path: `${mainEntry}/download/{docId}`,
    method: 'GET',
    handler: (request, reply) => {
      const { docId } = request.params;
      const jobType = constants.JOBTYPES.PRINTABLE_PDF;
      const syncResponse = has(request.query, 'sync');

      jobResponseHandler(request, reply, { docId, jobType }, { sync: syncResponse });
    },
    config: {
      pre: [ licensePreRouting, userPreRouting ],
      timeout: { socket: socketTimeout },
      tags: [API_TAG],
    },
  });
};
