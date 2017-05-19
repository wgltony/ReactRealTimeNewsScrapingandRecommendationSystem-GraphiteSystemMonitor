import boom from 'boom';
import { has } from 'lodash';
import { constants } from '../lib/constants';
import { createDocumentJobFactory } from '../lib/create_document_job';
import { licensePreRoutingFactory } from '../lib/license_pre_routing';
import { userPreRoutingFactory } from '../lib/user_pre_routing';
import { jobResponseHandlerFactory } from '../lib/job_response_handler';

const mainEntry = `${constants.API_BASE_URL}/generate`;
const API_TAG = 'api';

export function main(server) {
  const config = server.config();
  const DOWNLOAD_BASE_URL = config.get('server.basePath') + `${constants.API_BASE_URL}/jobs/download`;
  const socketTimeout = config.get('xpack.reporting.generate.socketTimeout');
  const { errors:esErrors } = server.plugins.elasticsearch.getCluster('admin');

  const createDocumentJob = createDocumentJobFactory(server);
  const licensePreRouting = licensePreRoutingFactory(server);
  const userPreRouting = userPreRoutingFactory(server);
  const jobResponseHandler = jobResponseHandlerFactory(server);

  function getConfig() {
    return {
      timeout: { socket: socketTimeout },
      tags: [API_TAG],
      pre: [ userPreRouting, licensePreRouting ],
    };
  };

  // show error about method to user
  server.route({
    path: `${mainEntry}/{p*}`,
    method: 'GET',
    handler: (request, reply) => {
      const err = boom.methodNotAllowed('GET is not allowed');
      err.output.headers.allow = 'POST';
      reply(err);
    },
    config: getConfig(),
  });

  // defined the public routes
  server.route({
    path: `${mainEntry}/visualization/{savedId}`,
    method: 'POST',
    handler: (request, reply) => pdfHandler('visualization', request, reply),
    config: getConfig(),
  });

  server.route({
    path: `${mainEntry}/search/{savedId}`,
    method: 'POST',
    handler: (request, reply) => pdfHandler('search', request, reply),
    config: getConfig(),
  });

  server.route({
    path: `${mainEntry}/dashboard/{savedId}`,
    method: 'POST',
    handler: (request, reply) => pdfHandler('dashboard', request, reply),
    config: getConfig(),
  });

  function pdfHandler(objectType, request, reply) {
    const jobType = constants.JOBTYPES.PRINTABLE_PDF;
    const createJob = createDocumentJob[jobType];
    const syncResponse = has(request.query, 'sync');

    return createJob(objectType, request)
    .then((job) => {
      if (syncResponse) {
        jobResponseHandler(request, reply, { docId: job.id, jobType }, { sync: true });
      } else {
        // return the queue's job information
        const jobJson = job.toJSON();

        const response = reply({
          path: `${DOWNLOAD_BASE_URL}/${jobJson.id}`,
          job: jobJson,
        });
        response.type('application/json');
      }
    })
    .catch((err) => {
      if (err instanceof esErrors['401']) return reply(boom.unauthorized());
      if (err instanceof esErrors['403']) return reply(boom.forbidden('Sorry, you are not authorized to create reports'));
      if (err instanceof esErrors['404']) return reply(boom.wrap(err, 404));
      reply(err);
    });
  }
};
