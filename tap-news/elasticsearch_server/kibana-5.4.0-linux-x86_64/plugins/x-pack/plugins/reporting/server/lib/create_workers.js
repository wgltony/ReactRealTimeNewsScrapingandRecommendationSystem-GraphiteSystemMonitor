import esqueueEvents from './esqueue/constants/events';
import { constants } from './constants';
import { workersFactory } from './workers';
import { oncePerServer } from './once_per_server';

function createWorkersFn(server) {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const workers = workersFactory(server);

  // Once more document types are added, this will need to be passed in
  return function createWorkers(queue) {
    const workerTypes = [
      constants.JOBTYPES.PRINTABLE_PDF
    ];

    workerTypes.forEach((workerType) => {
      const log = (msg) => {
        server.log(['reporting', 'worker', 'debug'], `${workerType}: ${msg}`);
      };

      log(`Registering ${workerType} worker`);
      const workerFn = workers[workerType];
      const workerOptions = {
        interval: queueConfig.pollInterval
      };
      const worker = queue.registerWorker(workerType, workerFn, workerOptions);

      worker.on(esqueueEvents.EVENT_WORKER_COMPLETE, (res) => log(`Worker completed: (${res.job.id})`));
      worker.on(esqueueEvents.EVENT_WORKER_JOB_EXECUTION_ERROR, (res) => log(`Worker error: (${res.job.id})`));
      worker.on(esqueueEvents.EVENT_WORKER_JOB_TIMEOUT, (res) => log(`Job timeout exceeded: (${res.job.id})`));
    });
  };
};

export const createWorkersFactory = oncePerServer(createWorkersFn);
