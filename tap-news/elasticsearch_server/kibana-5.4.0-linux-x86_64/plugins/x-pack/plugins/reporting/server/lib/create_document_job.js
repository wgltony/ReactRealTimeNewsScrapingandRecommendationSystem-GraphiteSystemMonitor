import moment from 'moment';
import { get } from 'lodash';
import esqueueEvents from './esqueue/constants/events';
import { constants } from './constants';
import { getUserFactory } from './get_user';
import { getSavedObjectFactory } from './get_saved_object';
import { cryptoFactory } from './crypto';
import { oncePerServer } from './once_per_server';

function createDocumentJobFn(server) {
  const jobQueue = server.plugins.reporting.queue;
  const filterHeaders = server.plugins.elasticsearch.filterHeaders;
  const queueConfig = server.config().get('xpack.reporting.queue');
  const whitelistHeaders = server.config().get('elasticsearch.requestHeadersWhitelist');

  const getSavedObject = getSavedObjectFactory(server);
  const getUser = getUserFactory(server);
  const crypto = cryptoFactory(server);

  const { JOBTYPES } = constants;
  const jobTypes = {};

  jobTypes[JOBTYPES.PRINTABLE_PDF] = async function (objectType, request) {
    const date = moment().toISOString();
    const objId = request.params.savedId;
    const query = request.query;

    const headers = get(request, 'headers');
    const serializedEncryptedHeaders = await crypto.encrypt(headers);

    return getUser(request)
    .then((user) => {
      // get resulting kibana saved object documents
      return getSavedObject(request, objectType, objId, query)
      .then(function (savedObject) {
        server.log(['reporting', 'debug'], `Saved object to process`);

        const payload = {
          id: savedObject.id,
          title: savedObject.title,
          description: savedObject.description,
          type: savedObject.type,
          // previously, we were saving an array of objects because the dashboard would return
          // an object per visualization/search, but now that we're using the dashboard to take screenshots
          // this is no longer required. However, I don't want to break previous versions of Kibana, so
          // we will continue to use the old schema
          objects: [ savedObject ],
          date,
          query,
          headers: serializedEncryptedHeaders,
        };

        const options = {
          timeout: queueConfig.timeout,
          created_by: get(user, 'username', false),
          headers: filterHeaders(headers, whitelistHeaders),
        };

        return { payload, options };
      })
      .then(params => {
        const { payload, options } = params;

        return new Promise((resolve, reject) => {
          const job = jobQueue.addJob(JOBTYPES.PRINTABLE_PDF, payload, options);
          job.on(esqueueEvents.EVENT_JOB_CREATED, () => resolve(job));
          job.on(esqueueEvents.EVENT_JOB_CREATE_ERROR, reject);
        });
      });
    });
  };

  return jobTypes;
}

export const createDocumentJobFactory = oncePerServer(createDocumentJobFn);
