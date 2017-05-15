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

import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlJobPreview', function (mlMessageBarService, mlJobService) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    template: require('plugins/ml/jobs/components/job_preview/job_preview.html'),
    link: function (scope, element, attrs) {
      scope.job = mlJobService.getJob(attrs.mlJobId);
      // make the delimiter user readable
      if (scope.job.data_description && scope.job.data_description.format === 'delimited') {
        scope.job.data_description.field_delimiter = scope.formatDelimiter(scope.job.data_description.field_delimiter);
      }
    }
  };
})

.directive('mlJobItem', function () {
  return {
    replace: true,
    restrict: 'EA',
  };
})

// add the job preview template to the template cache so there's no delay in displaying it
// which can cause positioning mistakes
.run(function ($templateRequest) {
  $templateRequest(chrome.getBasePath() + '/plugins/ml/jobs/components/job_preview/job_preview.html', true);
});

