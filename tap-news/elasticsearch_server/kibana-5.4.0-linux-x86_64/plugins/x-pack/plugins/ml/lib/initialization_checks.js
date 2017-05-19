/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

/*
 * Performs a number of checks during initialization of the Ml plugin,
 * such as that Elasticsearch is running, and that the Ml searches, visualizations
 * and dashboards exist in the Elasticsearch kibana index.
 */

import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';
import util from 'util';

const NoConnections = elasticsearch.errors.NoConnections;
const format = util.format;

module.exports = function (plugin, server) {
  const config = server.config();

  // Use the admin cluster for managing the .kibana index.
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
  const REQUEST_DELAY = config.get('elasticsearch.healthCheck.delay');

  const ML_RESULTS_INDEX_ID = '.ml-anomalies-*';    // Move to config file?
  const ML_NOTIFICATIONS_INDEX_ID = '.ml-notifications';

  plugin.status.yellow('Waiting for Elasticsearch');

  function waitForPong(callWithInternalUsr, url) {
    return callWithInternalUser('ping').catch(function (err) {
      if (!(err instanceof NoConnections)) throw err;
      plugin.status.red(format('Unable to connect to Elasticsearch at %s.', url));

      return Promise.delay(REQUEST_DELAY).then(waitForPong.bind(null, callWithInternalUsr, url));
    });
  }

  function waitForKibanaIndex() {
    return callWithInternalUser('cluster.health', {
      timeout: '5s',
      index: config.get('kibana.index'),
      ignore: [408]
    }).then((resp) => {
      // if "timed_out" === true then Elasticsearch could not find an index
      // matching our filter within 5 seconds.  If status === "red" that
      // means the index was found but the shards are not ready for queries.
      if (!resp || resp.timed_out || resp.status === 'red') {
        const interval = REQUEST_DELAY / 1000;
        const intervalFormatted = interval.toFixed(1);
        const secondsFormatted = interval === 1 ? 'second' : 'seconds';
        plugin.status.red(`Kibana index not available... Trying again in ${intervalFormatted} ${secondsFormatted}.`);
        return Promise.delay(REQUEST_DELAY).then(waitForKibanaIndex);
      }
    });
  }

  function waitForKibanaBuildNumDoc() {
    // Waits to check that the config doc that stores the default Kibana index pattern exists.
    // It is created by Kibana on initial start-up.
    return callWithInternalUser('exists', {
      index: config.get('kibana.index'),
      type: 'config',
      id: config.get('pkg.version')
    }).then((resp) => {
      if (resp !== true) {
        return Promise.delay(REQUEST_DELAY).then(waitForKibanaBuildNumDoc);
      }
    });
  }

  function checkForMlAnomaliesResultsIndexPattern() {
    return callWithInternalUser('exists', {
      index: config.get('kibana.index'),
      type: 'index-pattern',
      id: ML_RESULTS_INDEX_ID
    }).then((resp) => {
      if (resp !== true) {
        plugin.status.yellow('No .ml-anomalies-* index pattern found - creating index pattern');
        createMlResultsIndexPattern();
      }
    });
  }

  function createMlResultsIndexPattern() {
    callWithInternalUser('create', {
      index: config.get('kibana.index'),
      type: 'index-pattern',
      id: ML_RESULTS_INDEX_ID,
      body: {
        title : ML_RESULTS_INDEX_ID,
        timeFieldName: 'timestamp',
        fields: JSON.stringify([
          { name: '_index', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_id', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_type', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: '_score', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_source', type: '_source', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'timestamp', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'processing_time_ms', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'record_count', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'event_count', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'is_interim', type: 'boolean', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'initial_anomaly_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'initial_influencer_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencer_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'job_id', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'anomaly_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'renormalization_window', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'results_retention_days', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'finished_time', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'timeout', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'last_data_time', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'create_time', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'regex', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'examples', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'terms', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'influencer_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencer_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'initial_record_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'by_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'over_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'partition_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'by_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'function', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'function_description', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'detector_index', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'over_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'partition_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'record_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'typical', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'actual', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'model_upper', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'model_lower', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'model_median', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'model_feature', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.function', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.partition_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'causes.over_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.by_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.by_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'causes.function_description', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.over_field_value', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'causes.actual', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.partition_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.typical', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencers.influencer_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencers.influencer_field_values', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'bucketInfluencers.influencer_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucket_influencers.raw_anomaly_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucket_influencers.anomaly_score', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucket_influencers.probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucket_influencers.influencer_field_name', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true }
        ])
      }
    }, (error) => {
      if (error) {
        plugin.status.red('Error creating index pattern .ml-anomalies-*');
        console.log('Error creating index pattern .ml-anomalies-*:', error);
      }
    });
  }

  function checkForMlNotificationsIndexPattern() {
    return callWithInternalUser('exists', {
      index: config.get('kibana.index'),
      type: 'index-pattern',
      id: ML_NOTIFICATIONS_INDEX_ID
    }).then((resp) => {
      if (resp === true) {
        // ML plugin is good to go.
        plugin.status.green('Ready');
        stopChecking();
      } else {
        plugin.status.yellow('No ' + ML_NOTIFICATIONS_INDEX_ID + ' index pattern found - creating index pattern');
        createMlNotificationsIndexPattern();
      }
    });
  }

  function createMlNotificationsIndexPattern() {
    return callWithInternalUser('create', {
      index: config.get('kibana.index'),
      type: 'index-pattern',
      id: ML_NOTIFICATIONS_INDEX_ID,
      body: {
        title : ML_NOTIFICATIONS_INDEX_ID,
        timeFieldName: 'timestamp',
        fields: JSON.stringify([
          { name: '_index', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_id', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_type', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: '_score', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_source', type: '_source', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'timestamp', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'job_id', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'level', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'message', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: false }
        ])
      }
    }, (error) => {
      if (error) {
        plugin.status.red('Error creating index pattern ' + ML_NOTIFICATIONS_INDEX_ID);
        console.log('Error creating index pattern ' + ML_NOTIFICATIONS_INDEX_ID + ':', error);
      }
    });
  }

  function check() {
    const healthCheck =
      waitForPong(callWithInternalUser, config.get('elasticsearch.url'))
      .then(waitForKibanaIndex)
      .then(waitForKibanaBuildNumDoc)
      .then(checkForMlAnomaliesResultsIndexPattern)
      .then(checkForMlNotificationsIndexPattern);

    return healthCheck
    .catch(err => plugin.status.red(err));

  }

  let timeoutId = null;

  function scheduleCheck(ms) {
    if (timeoutId) {
      return;
    }

    const myId = setTimeout(() => {
      check().finally(() => {
        if (timeoutId === myId) startorRestartChecking();
      });
    }, ms);

    timeoutId = myId;
  }

  function startorRestartChecking() {
    scheduleCheck(stopChecking() ? REQUEST_DELAY : 1);
  }

  function stopChecking() {
    if (!timeoutId) {
      return false;
    }
    clearTimeout(timeoutId);
    timeoutId = null;
    return true;
  }

  return {
    run: check,
    start: startorRestartChecking,
    stop: stopChecking,
    isRunning: () => { return !!timeoutId; },
  };

};
