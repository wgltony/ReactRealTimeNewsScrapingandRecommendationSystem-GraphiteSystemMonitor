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

// the tooltip descriptions are located in tooltips.json

import './styles/main.less';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlEngineApiHelpLink', function () {
  return {
    scope: {
      uri: '@mlUri',
      label: '@mlLabel'
    },
    restrict: 'AE',
    replace: true,
    template: '<a href="{{fullUrl()}}" target="_blank" class="ml-engine-api-help-link" tooltip="{{label}}">' +
                '{{label}}<i class="fa fa-external-link"></i></a>',
    controller: function ($scope) {
      const website = 'http://www.prelert.com/docs/engine_api';
      const version = '2.0';
      $scope.fullUrl = function () {return website + '/' + version + '/' + $scope.uri;};
    }
  };

});
