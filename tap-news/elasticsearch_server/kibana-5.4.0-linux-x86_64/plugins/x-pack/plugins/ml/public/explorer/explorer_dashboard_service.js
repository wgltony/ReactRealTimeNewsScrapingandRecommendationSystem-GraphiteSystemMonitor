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
 * components in the Explorer dashboard.
 */

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlExplorerDashboardService', function () {

  const listeners = {
    'swimlaneCellClick': [],
    'swimlaneDataChange': [],
    'anomalyDataChange': []
  };

  this.init = function () {
    // Clear out any old listeners.
    listeners.swimlaneCellClick.splice(0);
    listeners.swimlaneDataChange.splice(0);
  };

  this.fireSwimlaneCellClick = function (cellData) {
    listeners.swimlaneCellClick.forEach(function (listener) {
      listener(cellData);
    });
  };

  this.addSwimlaneCellClickListener = function (listener) {
    listeners.swimlaneCellClick.push(listener);
  };

  this.fireSwimlaneDataChange = function (swimlaneType) {
    listeners.swimlaneDataChange.forEach(function (listener) {
      listener(swimlaneType);
    });
  };

  this.addSwimlaneDataChangeListener = function (listener) {
    listeners.swimlaneDataChange.push(listener);
  };

  this.fireAnomalyDataChange = function (anomalyRecords, earliestMs, latestMs) {
    listeners.anomalyDataChange.forEach(function (listener) {
      listener(anomalyRecords, earliestMs, latestMs);
    });
  };

  this.addAnomalyDataChangeListener = function (listener) {
    listeners.anomalyDataChange.push(listener);
  };

});
