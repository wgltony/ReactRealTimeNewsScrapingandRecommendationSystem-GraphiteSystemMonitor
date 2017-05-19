import { constants } from './constants';
import { oncePerServer } from './once_per_server';
import { docJobProcessFactory } from './doc_job_process';

function workersFN(server) {
  const docJobProcess = docJobProcessFactory(server);

  const workers = {};

  // printable PDFs
  workers[constants.JOBTYPES.PRINTABLE_PDF] = async function (payload) {
    const workerType = constants.JOBTYPES.PRINTABLE_PDF;

    server.log(['reporting', 'worker', 'debug'], `Converting ${payload.objects.length} saved object(s) to ${workerType}`);
    const { contentType, buffer } = await docJobProcess(payload);

    return {
      content_type: contentType,
      content: buffer.toString('base64')
    };
  };
  workers[constants.JOBTYPES.PRINTABLE_PDF].encoding = 'base64';
  workers[constants.JOBTYPES.PRINTABLE_PDF].contentType = docJobProcess.contentType;

  return workers;
};

export const workersFactory = oncePerServer(workersFN);