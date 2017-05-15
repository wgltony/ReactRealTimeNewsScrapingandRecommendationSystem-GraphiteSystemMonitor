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

import _ from 'lodash';
import stringUtils from 'plugins/ml/util/string_utils';
import angular from 'angular';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlDetectorModal', function ($scope, $modalInstance, params, mlJobService, mlMessageBarService) {
  const msgs = mlMessageBarService;
  msgs.clear();
  $scope.title = 'Add new detector';
  $scope.detector = { 'function': '' };
  $scope.saveLock = false;
  $scope.editMode = false;
  let index = -1;

  $scope.functions = [
    { id: 'count',                 uri: 'count.html#count' },
    { id: 'low_count',             uri: 'count.html#count' },
    { id: 'high_count',            uri: 'count.html#count' },
    { id: 'non_zero_count',        uri: 'count.html#non-zero-count' },
    { id: 'low_non_zero_count',    uri: 'count.html#non-zero-count' },
    { id: 'high_non_zero_count',   uri: 'count.html#non-zero-count' },
    { id: 'distinct_count',        uri: 'count.html#distinct-count' },
    { id: 'low_distinct_count',    uri: 'count.html#distinct-count' },
    { id: 'high_distinct_count',   uri: 'count.html#distinct-count' },
    { id: 'rare',                  uri: 'rare.html#rare' },
    { id: 'freq_rare',             uri: 'rare.html#freq-rare' },
    { id: 'info_content',          uri: 'info_content.html#info-content' },
    { id: 'low_info_content',      uri: 'info_content.html#info-content' },
    { id: 'high_info_content',     uri: 'info_content.html#info-content' },
    { id: 'metric',                uri: 'metric.html#metric' },
    { id: 'median',                uri: 'metric.html#median' },
    { id: 'mean',                  uri: 'metric.html#mean' },
    { id: 'low_mean',              uri: 'metric.html#mean' },
    { id: 'high_mean',             uri: 'metric.html#mean' },
    { id: 'min',                   uri: 'metric.html#min' },
    { id: 'max',                   uri: 'metric.html#max' },
    { id: 'varp',                  uri: 'metric.html#varp' },
    { id: 'low_varp',              uri: 'metric.html#varp' },
    { id: 'high_varp',             uri: 'metric.html#varp' },
    { id: 'sum',                   uri: 'sum.html#sum' },
    { id: 'low_sum',               uri: 'sum.html#sum' },
    { id: 'high_sum',              uri: 'sum.html#sum' },
    { id: 'non_null_sum',          uri: 'sum.html#non-null-sum' },
    { id: 'low_non_null_sum',      uri: 'sum.html#non-null-sum' },
    { id: 'high_non_null_sum',     uri: 'sum.html#non-null-sum' },
    { id: 'time_of_day',           uri: 'time.html#time-of-day' },
    { id: 'time_of_week',          uri: 'time.html#time-of-week' },
    { id: 'lat_long',              uri: 'geographic.html' },
  ];

  $scope.properties = params.properties;

  // properties list for by_field_name field only
  $scope.properties_byFieldName = angular.copy($scope.properties);
  // if data has been added to the categorizationFieldName,
  // add the option mlcategory to the by_field_name datalist
  if (params.catFieldNameSelected) {
    $scope.properties_byFieldName.mlcategory = 'mlcategory';
  }

  const validate = params.validate;
  const add = params.add;
  if (params.detector) {
    $scope.detector = params.detector;
    index = params.index;
    $scope.title = 'Edit detector';
    $scope.editMode = true;
  }

  $scope.detectorToString = stringUtils.detectorToString;

  $scope.helpLink = {};

  $scope.functionChange = function () {
    const func = _.findWhere($scope.functions, { id: $scope.detector.function });
    $scope.helpLink.uri = 'functions/';
    $scope.helpLink.label = 'Help for ';

    if (func) {
      $scope.helpLink.uri += func.uri;
      $scope.helpLink.label += func.id;
    } else {
      $scope.helpLink.uri += 'functions.html';
      $scope.helpLink.label += 'analytical functions';
    }
  };

  $scope.functionChange();

  $scope.save = function () {
    $scope.saveLock = true;
    validate($scope.detector)
      .then((resp) => {
        $scope.saveLock = false;
        if (resp.success) {
          if ($scope.detector.detector_description === '') {
            // remove blank description so server generated one is used.
            delete $scope.detector.detector_description;
          }
          add($scope.detector, index);
          $modalInstance.close($scope.detector);
          msgs.clear();

        } else {
          msgs.error(resp.message);
        }
      });
  };

  $scope.cancel = function () {
    msgs.clear();
    $modalInstance.dismiss('cancel');
  };
});
