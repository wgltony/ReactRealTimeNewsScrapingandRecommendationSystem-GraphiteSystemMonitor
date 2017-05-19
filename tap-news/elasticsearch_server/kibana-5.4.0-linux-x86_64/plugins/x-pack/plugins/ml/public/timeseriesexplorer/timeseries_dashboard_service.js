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
 * Service for firing and registering for events across the different
 * components in the Time Series explorer dashboard.
 */

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlTimeSeriesDashboardService', function () {

  const listeners = {
    'anomalyRecordMouseenter': [],
    'anomalyRecordMouseleave': []
  };

  this.init = function () {
    // Clear out any old listeners.
    listeners.anomalyRecordMouseenter.splice(0);
    listeners.anomalyRecordMouseleave.splice(0);
  };

  this.fireAnomalyRecordMouseenter = function (record) {
    listeners.anomalyRecordMouseenter.forEach(function (listener) {
      listener(record);
    });
  };

  this.onAnomalyRecordMouseenter = function (listener) {
    listeners.anomalyRecordMouseenter.push(listener);
  };

  this.fireAnomalyRecordMouseleave = function (record) {
    listeners.anomalyRecordMouseleave.forEach(function (listener) {
      listener(record);
    });
  };

  this.onAnomalyRecordMouseleave = function (listener) {
    listeners.anomalyRecordMouseleave.push(listener);
  };

});
