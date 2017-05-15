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
 * AngularJS directive for rendering the containing div for the charts of
 * anomalies in the raw data in the Machine Learning Explorer dashboard.
 */

import $ from 'jquery';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlExplorerChartsContainer', function () {

  function link(scope, element) {
    // Create a div for the tooltip.
    $('.ml-explorer-charts-tooltip').remove();
    $('body').append('<div class="ml-explorer-tooltip ml-explorer-charts-tooltip" style="opacity:0">');

    element.on('$destroy', function () {
      scope.$destroy();
    });
  }

  return {
  	restrict: 'E',
    scope: {
      seriesToPlot: '=',
      plotEarliest: '=',
      plotLatest: '=',
      selectedEarliest: '=',
      selectedLatest: '=',
      chartsPerRow: '=',
      layoutCellsPerChart: '=',
      tooManyBuckets: '='
    },
    link: link,
    template: require('plugins/ml/explorer/explorer_charts/explorer_charts_container.html')
  };
});