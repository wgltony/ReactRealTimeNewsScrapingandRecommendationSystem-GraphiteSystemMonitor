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

// Service with functions used across Ml dashboards, such as broadcasting
// and listening for events.
import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlDashboardService', function ($rootScope) {

  // Broadcasts that a change has been made to the selected jobs.
  this.broadcastJobSelectionChange = function (selectedJobIds) {
    $rootScope.$broadcast('jobSelectionChange', selectedJobIds);
  };

  // Add a listener for changes to the selected jobs.
  this.listenJobSelectionChange = function (scope, callback) {
    const handler = $rootScope.$on('jobSelectionChange', callback);
    scope.$on('$destroy', handler);
  };

});
