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
 * ml-job-select-list directive for rendering a multi-select control for selecting
 * one or more jobs from the list of configured jobs.
 */

import _ from 'lodash';
import $ from 'jquery';

import jobUtils from 'plugins/ml/util/job_utils';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlJobSelectList', ['mlJobService', 'mlDashboardService', function (mlJobService, mlDashboardService) {
  return {
    restrict: 'AE',
    replace: true,
    transclude: true,
    template: require('plugins/ml/components/job_select_list/job_select_list.html'),
    controller: function ($scope) {
      mlJobService.loadJobs()
        .then(function (resp) {
          if (resp.jobs.length > 0) {
            const jobs = [];
            _.each(resp.jobs, function (job) {
              if ($scope.timeSeriesOnly === false || jobUtils.isTimeSeriesViewJob(job) === true) {
                jobs.push({ id:job.job_id });
              }
            });
            $scope.jobs = jobs;

            if ($scope.selections.length === 1 && $scope.selections[0] === '*') {
              // Replace the '*' selection with the complete list of job IDs.
              $scope.selections = _.map($scope.jobs, function (job) { return job.id; });
            }
          }
        }).catch(function (resp) {
          console.log('mlJobSelectList controller - error getting job info from ES:', resp);
        });

      $scope.apply = function () {
        if ($scope.selections.length === $scope.jobs.length) {
          mlDashboardService.broadcastJobSelectionChange(['*']);
        } else {
          mlDashboardService.broadcastJobSelectionChange($scope.selections);
        }
        $scope.closePopover();
      };

      $scope.toggleSelection = function (jobId) {
        const idx = $scope.selections.indexOf(jobId);
        if (idx > -1) {
          $scope.selections.splice(idx, 1);
        } else {
          $scope.selections.push(jobId);
        }
      };

      $scope.isSelected = function (jobId) {
        return (_.contains($scope.selections, jobId) || ($scope.selections.length === 1 && $scope.selections[0] === '*'));
      };

    },
    link: function (scope, element, attrs) {
      scope.timeSeriesOnly = false;
      if (attrs.timeseriesonly !== undefined && /true/i.test(attrs.timeseriesonly)) {
        scope.timeSeriesOnly = true;
      }

      // List of jobs to select is passed to the directive in the 'selected' attribute.
      // '*' is passed to indicate 'All jobs'.
      scope.selections = (attrs.selected ? attrs.selected.split(' ') : []);

      scope.selectAll = function () {
        $('input:checkbox', element).prop('checked', true);
        scope.selections = _.map(scope.jobs, function (job) { return job.id; });
      };

      scope.unselectAll = function () {
        $('input:checkbox', element).prop('checked', false);
        scope.selections = [];
      };

      // Giving the parent div focus fixes checkbox tick UI selection on IE.
      $('.ml-select-list', element).focus();
    }
  };
}]);

// Add the job select template to the template cache so there's no delay in displaying it
// which can cause positioning mistakes.
// .run(function ($templateRequest) {
  // $templateRequest('/plugins/ml/components/job_select_list/job_select_list.html', true);
// });

