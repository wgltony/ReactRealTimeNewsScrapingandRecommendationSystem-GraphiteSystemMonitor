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

import moment from 'moment';
import _ from 'lodash';

import stringUtils from 'plugins/ml/util/string_utils';
import anomalyUtils from 'plugins/ml/util/anomaly_utils';

import 'plugins/ml/components/paginated_table';
import 'plugins/ml/filters/format_value';
import 'plugins/ml/filters/metric_change_description';
import 'plugins/ml/services/job_service';
import './expanded_row/expanded_row_directive';

import linkControlsHtml from './anomalies_table_links.html';
import openRowArrow from 'ui/doc_table/components/table_row/open.html';
import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlAnomaliesTable', function ($window, $rootScope, mlJobService, mlResultsService,
  mlTimeSeriesDashboardService, formatValueFilter, AppState) {
  return {
    restrict: 'E',
    scope: {
      anomalyRecords: '=',
      indexPatternId: '=',
      timeFieldName: '='
    },
    template: require('plugins/ml/timeseriesexplorer/anomalies_table/anomalies_table.html'),
    link: function (scope, element) {
      const appState = new AppState();
      appState.fetch();

      scope.thresholdOptions = [
        { display:'critical', val:75 },
        { display:'major', val:50 },
        { display:'minor', val:25 },
        { display:'warning', val:0 }];

      scope.intervalOptions = [
        { display:'Auto', val:'auto' },
        { display:'1 hour', val:'hour' },
        { display:'1 day', val:'day' },
        { display:'Show all', val:'second' }];

      // Store the threshold and aggregation interval in the AppState so that they
      // are restored on page refresh.
      if (appState.mlAnomaliesTable === undefined) {
        appState.mlAnomaliesTable = {};
      }

      let thresholdValue = _.get(appState, 'mlAnomaliesTable.thresholdValue', 0);
      let thresholdOption = _.findWhere(scope.thresholdOptions, { val:thresholdValue });
      if (thresholdOption === undefined) {
        // Attempt to set value in URL which doesn't map to one of the options.
        thresholdOption = _.findWhere(scope.thresholdOptions, { val:0 });
        thresholdValue = 0;
      }
      scope.threshold = thresholdOption;

      let intervalValue = _.get(appState, 'mlAnomaliesTable.intervalValue', 'auto');
      let intervalOption = _.findWhere(scope.intervalOptions, { val:intervalValue });
      if (intervalOption === undefined) {
        // Attempt to set value in URL which doesn't map to one of the options.
        intervalOption = _.findWhere(scope.intervalOptions, { val:'auto' });
        intervalValue = 'auto';
      }
      scope.interval = intervalOption;
      scope.momentInterval = 'second';

      appState.mlAnomaliesTable.thresholdValue = thresholdValue;
      appState.mlAnomaliesTable.intervalValue = intervalValue;
      appState.save();

      scope.table = {};
      scope.table.perPage = 25;
      scope.table.columns = [];
      scope.table.rows = [];
      scope.rowScopes = [];

      scope.categoryExamplesByJob = {};
      const MAX_NUMBER_CATEGORY_EXAMPLES = 10;  // Max number of examples to show in table cell or expanded row (engine default is to store 4).

      scope.$on('renderTable',function () {
        updateTableData();
      });

      element.on('$destroy', function () {
        scope.$destroy();
      });

      scope.isShowingAggregatedData = function () {
        return (scope.interval.display !== 'Show all');
      };

      scope.setThreshold = function (threshold) {
        scope.threshold = threshold;
        appState.mlAnomaliesTable.thresholdValue = threshold.val;
        appState.save();
        updateTableData();
      };

      scope.setInterval = function (interval) {
        scope.interval = interval;
        appState.mlAnomaliesTable.intervalValue = interval.val;
        appState.save();
        updateTableData();
      };

      scope.getExamplesForCategory = function (jobId, categoryId) {
        return _.get(scope.categoryExamplesByJob, [jobId, categoryId], []);
      };

      scope.openLink = function (link, record) {
        console.log('Anomalies Table - open link for record:', link, record);

        // If url_value contains $earliest$ and $latest$ tokens, add in times to the source record.
        const timestamp = record[scope.timeFieldName];
        const configuredUrlValue = link.url_value;
        if (configuredUrlValue.includes('$earliest$')) {
          const roundedMoment = moment(timestamp).startOf(scope.momentInterval);
          if (scope.momentInterval === 'hour') {
            // Start from the previous hour.
            roundedMoment.subtract(1, 'h');
          }
          record.earliest = roundedMoment.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
        }

        if (configuredUrlValue.includes('$latest$')) {
          if (scope.isShowingAggregatedData()) {
            const roundedMoment = moment(timestamp).endOf(scope.momentInterval);
            if (scope.momentInterval === 'hour') {
              // Show to the end of the next hour.
              roundedMoment.add(1, 'h');
            }
            record.latest = roundedMoment.toISOString();      // e.g. 2016-02-08T18:59:59.999Z
          } else {
            // Show the time span of the selected record's bucket.
            const latestMoment = moment(timestamp).add(record.bucket_span, 's');
            record.latest = latestMoment.toISOString();
          }
        }

        // If url_value contains $mlcategoryterms$ or $mlcategoryregex$, add in the
        // terms and regex for the selected categoryId to the source record.
        if ((configuredUrlValue.includes('$mlcategoryterms$') || configuredUrlValue.includes('$mlcategoryregex$'))
                && _.has(record, 'mlcategory')) {
          const jobId = record.job_id;

          // mlcategory in the source record will be an array
          // - use first value (will only ever be more than one if influenced by category other than by/partition/over).
          const categoryId = record.mlcategory[0];

          mlJobService.getCategoryDefinition(scope.indexPatternId, jobId, categoryId)
          .then(function (resp) {
            // Prefix each of the terms with '+' so that the Elasticsearch Query String query
            // run in a drilldown Kibana dashboard has to match on all terms.
            const termsArray = _.map(resp.terms.split(' '), function (term) { return '+' + term; });
            record.mlcategoryterms = termsArray.join(' ');
            record.mlcategoryregex = resp.regex;

            // Replace any tokens in the configured url_value with values from the source record,
            // and then open link in a new tab/window.
            const urlPath = stringUtils.replaceStringTokens(link.url_value, record, true);
            $window.open(urlPath, '_blank');

          }).catch(function (resp) {
            console.log('openLink(): error loading categoryDefinition:', resp);
          });

        } else {
          // Replace any tokens in the configured url_value with values from the source record,
          // and then open link in a new tab/window.
          const urlPath = stringUtils.replaceStringTokens(link.url_value, record, true);
          $window.open(urlPath, '_blank');
        }

      };

      function updateTableData() {
        let summaryRecords = [];
        if (scope.isShowingAggregatedData()) {
          // Aggregate the anomaly data by time and detector, and entity (by/over).
          summaryRecords = aggregateAnomalies();
        } else {
          // Show all anomaly records.
          scope.momentInterval = scope.interval.val;
          const filteredRecords = _.filter(scope.anomalyRecords, function (record) {
            return Number(record.record_score) >= scope.threshold.val;
          });

          _.each(filteredRecords, function (record) {
            const detectorIndex = record.detector_index;
            const jobId = record.job_id;
            let detector = record.function_description;
            if ((_.has(mlJobService.detectorsByJob, jobId)) && (detectorIndex < mlJobService.detectorsByJob[jobId].length)) {
              detector = mlJobService.detectorsByJob[jobId][detectorIndex].detector_description;
            }

            const displayRecord = {
              'time': record[scope.timeFieldName],
              'max severity': record.record_score,
              'detector': detector,
              'jobId': jobId,
              'source': record
            };

            const entityName = anomalyUtils.getEntityFieldName(record);
            if (entityName !== undefined) {
              displayRecord.entityName = entityName;
              displayRecord.entityValue = anomalyUtils.getEntityFieldValue(record);
            }

            if (_.has(record, 'partition_field_name')) {
              displayRecord.partitionFieldName = record.partition_field_name;
              displayRecord.partitionFieldValue = record.partition_field_value;
            }

            if (_.has(record, 'influencers')) {
              const influencers = [];
              const sourceInfluencers = _.sortBy(record.influencers, 'influencer_field_name');
              _.each(sourceInfluencers, function (influencer) {
                const influencerFieldName = influencer.influencer_field_name;
                _.each(influencer.influencer_field_values, function (influencerFieldValue) {
                  const influencerToAdd = {};
                  influencerToAdd[influencerFieldName] = influencerFieldValue;
                  influencers.push(influencerToAdd);
                });
              });
              displayRecord.influencers = influencers;
            }

            const functionDescription = _.get(record, 'function_description', '');
            if (anomalyUtils.showActualForFunction(functionDescription) === true) {
              if (_.has(record, 'actual')) {
                displayRecord.actual = record.actual;
              } else {
                // If only a single cause, copy values to the top level.
                if (_.get(record, 'causes', []).length === 1) {
                  const cause = _.first(record.causes);
                  displayRecord.actual = cause.actual;
                }
              }
            }
            if (anomalyUtils.showTypicalForFunction(functionDescription) === true) {
              if (_.has(record, 'typical')) {
                displayRecord.typical = record.typical;
              } else {
                // If only a single cause, copy values to the top level.
                if (_.get(record, 'causes', []).length === 1) {
                  const cause = _.first(record.causes);
                  displayRecord.typical = cause.typical;
                }
              }
            }

            if (_.has(mlJobService.customUrlsByJob, jobId)) {
              displayRecord.links = mlJobService.customUrlsByJob[jobId];
            }

            summaryRecords.push(displayRecord);

          });
        }

        _.invoke(scope.rowScopes, '$destroy');
        scope.rowScopes.length = 0;

        const showExamples = _.some(summaryRecords, { 'entityName': 'mlcategory' });
        if (showExamples) {
          // Obtain the list of categoryIds by jobId for which we need to obtain the examples.
          // Note category examples will not be displayed if mlcategory is used just an
          // influencer or as a partition field in a config with other by/over fields.
          const categoryRecords = _.where(summaryRecords, { entityName: 'mlcategory' });
          const categoryIdsByJobId = {};
          _.each(categoryRecords, function (record) {
            if (!_.has(categoryIdsByJobId, record.jobId)) {
              categoryIdsByJobId[record.jobId] = [];
            }
            categoryIdsByJobId[record.jobId].push(record.entityValue);
          });
          loadCategoryExamples(categoryIdsByJobId);
        } else {
          scope.categoryExamplesByJob = {};
        }

        // Only show columns in the table which exist in the results.
        scope.table.columns = getPaginatedTableColumns(summaryRecords);

        // Sort by severity by default.
        summaryRecords = (_.sortBy(summaryRecords, 'max severity')).reverse();
        scope.table.rows = summaryRecords.map(function (record) {
          return createTableRow(record);
        });

      }

      function aggregateAnomalies() {
        // Aggregate the anomaly data by time, detector, and entity (by/over/partition).
        // TODO - do we want to aggregate by job too, in cases where different jobs
        // have detectors with the same description.
        console.log('aggregateAnomalies(): number of anomalies to aggregate:', scope.anomalyRecords.length);

        if (scope.anomalyRecords.length === 0) {
          return [];
        }

        // Determine the aggregation interval - records in scope are in descending time order.
        if (scope.interval.val === 'auto') {
          const earliest = moment(_.last(scope.anomalyRecords)[scope.timeFieldName]);
          const latest = moment(_.first(scope.anomalyRecords)[scope.timeFieldName]);
          const daysDiff = latest.diff(earliest, 'days');
          scope.momentInterval = (daysDiff < 2 ? 'hour' : 'day');
        } else {
          scope.momentInterval = scope.interval.val;
        }

        // Only show records passing the severity threshold.
        const filteredRecords = _.filter(scope.anomalyRecords, function (record) {

          return Number(record.record_score) >= scope.threshold.val;
        });

        const aggregatedData = {};
        _.each(filteredRecords, function (record) {

          // Use moment.js to get start of interval. This will use browser timezone.
          // TODO - support choice of browser or UTC timezone once funcitonality is in Kibana.
          const roundedTime = moment(record[scope.timeFieldName]).startOf(scope.momentInterval).valueOf();
          if (!_.has(aggregatedData, roundedTime)) {
            aggregatedData[roundedTime] = {};
          }

          // Aggregate by detector - default to functionDescription if no description available.
          const detectorIndex = record.detector_index;
          const jobId = record.job_id;
          let detector = record.function_description;
          if ((_.has(mlJobService.detectorsByJob, jobId)) && (detectorIndex < mlJobService.detectorsByJob[jobId].length)) {
            detector = mlJobService.detectorsByJob[jobId][detectorIndex].detector_description;
          }
          const detectorsAtTime = aggregatedData[roundedTime];
          if (!_.has(detectorsAtTime, detector)) {
            detectorsAtTime[detector] = {};
          }

          // Now add an object for the anomaly with the highest anomaly score per entity.
          // For the choice of entity, look in order for byField, overField, partitionField.
          // If no by/over/partition, default to an empty String.
          const entitiesForDetector = detectorsAtTime[detector];

          // TODO - are we worried about different byFields having the same
          // value e.g. host=server1 and machine=server1?
          let entity = anomalyUtils.getEntityFieldValue(record);
          if (entity === undefined) {
            entity = '';
          }
          if (!_.has(entitiesForDetector, entity)) {
            entitiesForDetector[entity] = record;
          } else {
            const score = record.record_score;
            if (score > entitiesForDetector[entity].record_score) {
              entitiesForDetector[entity] = record;
            }
          }
        });

        console.log('aggregateAnomalies() aggregatedData is:', aggregatedData);

        // Flatten the aggregatedData to give a list of records with the highest score per bucketed time / detector.
        const summaryRecords = [];
        _.each(aggregatedData, function (timeDetectors, roundedTime) {
          _.each(timeDetectors, function (entityDetectors, detector) {
            _.each(entityDetectors, function (record, entity) {
              const displayRecord = {
                'time': +roundedTime,
                'max severity': record.record_score,
                'detector': detector,
                'jobId': record.job_id,
                'source': record
              };

              const entityName = anomalyUtils.getEntityFieldName(record);
              if (entityName !== undefined) {
                displayRecord.entityName = entityName;
                displayRecord.entityValue = entity;
              }

              if (_.has(record, 'partition_field_name')) {
                displayRecord.partitionFieldName = record.partition_field_name;
                displayRecord.partitionFieldValue = record.partition_field_value;
              }

              if (_.has(record, 'influencers')) {
                const influencers = [];
                const sourceInfluencers = _.sortBy(record.influencers, 'influencer_field_name');
                _.each(sourceInfluencers, function (influencer) {
                  const influencerFieldName = influencer.influencer_field_name;
                  _.each(influencer.influencer_field_values, function (influencerFieldValue) {
                    const influencerToAdd = {};
                    influencerToAdd[influencerFieldName] = influencerFieldValue;
                    influencers.push(influencerToAdd);
                  });
                });
                displayRecord.influencers = influencers;
              }

              // Copy actual and typical values to the top level for display.
              const functionDescription = _.get(record, 'function_description', '');
              if (anomalyUtils.showActualForFunction(functionDescription) === true) {
                if (_.has(record, 'actual')) {
                  displayRecord.actual = record.actual;
                } else {
                  // If only a single cause, copy value to the top level.
                  if (_.get(record, 'causes', []).length === 1) {
                    const cause = _.first(record.causes);
                    displayRecord.actual = cause.actual;
                  }
                }
              }
              if (anomalyUtils.showTypicalForFunction(functionDescription) === true) {
                if (_.has(record, 'typical')) {
                  displayRecord.typical = record.typical;
                } else {
                  // If only a single cause, copy value to the top level.
                  if (_.get(record, 'causes', []).length === 1) {
                    const cause = _.first(record.causes);
                    displayRecord.typical = cause.typical;
                  }
                }
              }

              // TODO - do we always want the links column visible even when no customUrls have been defined?
              if (_.has(mlJobService.customUrlsByJob, record.job_id)) {
                displayRecord.links = mlJobService.customUrlsByJob[record.job_id];
              }

              summaryRecords.push(displayRecord);

            });
          });
        });

        return summaryRecords;

      }

      function getPaginatedTableColumns(summaryRecords) {
        // Builds the list of columns for use in the paginated table:
        // row expand arrow
        // time
        // max severity
        // detector
        // found for (if by/over/partition)
        // influenced by (if influencers)
        // actual
        // typical
        // description (how actual compares to typical)
        // job_id
        // links (if links configured)
        // category examples (if by mlcategory)
        const paginatedTableColumns = [
          { title: '', sortable: false, class: 'col-expand-arrow' },
          { title: 'time', sortable: true }];

        if (scope.isShowingAggregatedData()) {
          paginatedTableColumns.push({ title: 'max severity', sortable: true });
        } else {
          paginatedTableColumns.push({ title: 'severity', sortable: true });
        }

        paginatedTableColumns.push({ title: 'detector', sortable: true });

        const showEntity = _.some(summaryRecords, 'entityValue');
        const showInfluencers = _.some(summaryRecords, 'influencers');
        const showActual = _.some(summaryRecords, 'actual');
        const showTypical = _.some(summaryRecords, 'typical');
        const showExamples = _.some(summaryRecords, { 'entityName': 'mlcategory' });
        const showLinks = _.some(summaryRecords, 'links');

        if (showEntity === true) {
          paginatedTableColumns.push({ title: 'found for', sortable: true });
        }
        if (showInfluencers === true) {
          paginatedTableColumns.push({ title: 'influenced by', sortable: true });
        }
        if (showActual === true) {
          paginatedTableColumns.push({ title: 'actual', sortable: true });
        }
        if (showTypical === true) {
          // Assume that if we are showing typical, there will be an actual too,
          // so we can add a column to describe how actual compares to typical.
          paginatedTableColumns.push({ title: 'typical', sortable: true });
          paginatedTableColumns.push({ title: 'description', sortable: true });
        }
        paginatedTableColumns.push({ title: 'job ID', sortable: true });
        if (showLinks === true) {
          paginatedTableColumns.push({ title: 'links', sortable: false });
        }
        if (showExamples === true) {
          paginatedTableColumns.push({ title: 'category examples', sortable: false });
        }

        return paginatedTableColumns;
      }


      function createTableRow(record) {
        const rowScope = scope.$new();
        rowScope.expandable = true;
        rowScope.expandElement = 'ml-anomalies-table-expanded-row';
        rowScope.record = record;
        rowScope.isShowingAggregatedData = scope.isShowingAggregatedData();

        rowScope.initRow = function () {
          if (_.has(record, 'entityValue') && record.entityName === 'mlcategory') {
            // Obtain the category definition and display the examples in the expanded row.
            mlJobService.getCategoryDefinition(scope.indexPatternId, record.jobId, record.entityValue)
            .then(function (resp) {
              rowScope.categoryDefinition = {
                'examples':_.slice(resp.examples, 0, Math.min(resp.examples.length, MAX_NUMBER_CATEGORY_EXAMPLES)) };
            }).catch(function (resp) {
              console.log('Anomalies table createTableRow(): error loading categoryDefinition:', resp);
            });
          }

          rowScope.$broadcast('initRow', record);
        };

        rowScope.mouseenterRow = function () {
          // Publish that a record is being hovered over, so that the corresponding marker
          // in the model plot chart can be highlighted.
          mlTimeSeriesDashboardService.fireAnomalyRecordMouseenter(record);

        };

        rowScope.mouseleaveRow = function () {
          // Publish that a record is no longer being hovered over, so that the corresponding marker in the
          // model plot chart can be unhighlighted.
          mlTimeSeriesDashboardService.fireAnomalyRecordMouseleave(record);
        };

        // Create a table row with the following columns:
        //   row expand arrow
        //   time
        //   max severity
        //   detector
        //   found for (if by/over/partition)
        //   influenced by (if influencers)
        //   actual
        //   typical
        //   description (how actual compares to typical)
        //   job_id
        //   links (if links configured)
        //   category examples (if by mlcategory)
        const addEntity = _.findWhere(scope.table.columns, { 'title':'found for' });
        const addInfluencers = _.findWhere(scope.table.columns, { 'title':'influenced by' });

        // Assume that if we are showing typical, there will be an actual too,
        // so we can add a column to describe how actual compares to typical.
        const addActual = _.findWhere(scope.table.columns, { 'title':'actual' });
        const addTypical = _.findWhere(scope.table.columns, { 'title':'typical' });
        const addExamples = _.findWhere(scope.table.columns, { 'title':'category examples' });
        const addLinks = _.findWhere(scope.table.columns, { 'title':'links' });

        const tableRow = [
          {
            markup: openRowArrow,
            scope:  rowScope
          },
          {
            markup: formatTimestamp(record.time),
            value: record.time
          },
          {
            markup: parseInt(record['max severity']) >= 1 ?
            '<i class="fa fa-exclamation-triangle icon-severity-' + anomalyUtils.getSeverity(record['max severity']) + '"></i> '
              + Math.floor(record['max severity']) :
            '<i class="fa fa-exclamation-triangle icon-severity-' + anomalyUtils.getSeverity(record['max severity']) + '"></i> &lt; 1',
            value:  record['max severity']
          },
          {
            markup: record.detector,
            value:  record.detector
          }
        ];

        if (addEntity !== undefined) {
          if (_.has(record, 'entityValue')) {
            if (record.entityName !== 'mlcategory') {
              tableRow.push({
                markup: record.entityValue,
                value:  record.entityValue
              });
            } else {
              tableRow.push({
                markup: 'mlcategory ' + record.entityValue,
                value:  record.entityValue
              });
            }
          } else {
            tableRow.push({
              markup: '',
              value: ''
            });
          }
        }

        if (addInfluencers !== undefined) {
          if (_.has(record, 'influencers')) {
            let cellMarkup = '';
            _.each(record.influencers, function (influencer) {
              _.each(influencer, function (influencerFieldValue, influencerFieldName) {
                cellMarkup += (influencerFieldName + ': ' + influencerFieldValue + '<br>');
              });
            });
            tableRow.push({
              markup: cellMarkup,
              value:  cellMarkup
            });
          } else {
            tableRow.push({
              markup: '',
              value: ''
            });
          }
        }

        if (addActual !== undefined) {
          if (_.has(record, 'actual')) {
            const actualVal = formatValueFilter(record.actual, record.source.function);
            tableRow.push({ markup: actualVal, value: actualVal, scope: rowScope });
          } else {
            tableRow.push({ markup: '', value: '' });
          }
        }
        if (addTypical !== undefined) {
          if (_.has(record, 'typical')) {
            const typicalVal = formatValueFilter(record.typical, record.source.function);
            tableRow.push({ markup: typicalVal, value: typicalVal, scope: rowScope });

            // Use the metricChangeDescription filter to format a textual description of actual vs typical.
            const actualVal = formatValueFilter(record.actual, record.source.function);
            const factor = (actualVal > typicalVal) ? actualVal / typicalVal : typicalVal / actualVal;
            tableRow.push({ markup: '<span ng-bind-html="' + actualVal + ' | metricChangeDescription:' + typicalVal + '"></span>',
              value: Math.abs(factor), scope: rowScope });
          } else {
            tableRow.push({ markup: '', value: '' });
            tableRow.push({ markup: '', value: '' });
          }
        }

        tableRow.push({ markup: record.jobId, value: record.jobId });

        // TODO - add in links
        if (addLinks !== undefined) {
          if (_.has(record, 'links')) {
            rowScope.links = record.links;
            rowScope.source = record.source;

            tableRow.push({
              markup: linkControlsHtml,
              scope: rowScope
            });
          } else {
            tableRow.push({
              markup: '',
              value: ''
            });
          }
        }

        if (addExamples !== undefined) {
          if (record.entityName === 'mlcategory') {
            tableRow.push({ markup: '<span style="display: block; white-space:nowrap;" ' +
              'ng-repeat="item in getExamplesForCategory(record.jobId, record.entityValue)">{{item}}</span>', scope:  rowScope });
          } else {
            tableRow.push({ markup: '', value: '' });
          }
        }

        scope.rowScopes.push(rowScope);

        return tableRow;

      }

      function loadCategoryExamples(categoryIdsByJobId) {
        // Load the example events for the specified map of job_ids and categoryIds from Elasticsearch.
        scope.categoryExamplesByJob = {};
        _.each(categoryIdsByJobId, function (categoryIds, jobId) {
          mlResultsService.getCategoryExamples(scope.indexPatternId, jobId, categoryIds, MAX_NUMBER_CATEGORY_EXAMPLES)
          .then(function (resp) {
            scope.categoryExamplesByJob[jobId] = resp.examplesByCategoryId;
          }).catch(function (resp) {
            console.log('Anomalies table - error getting category examples:', resp);
          });
        });
      }

      function formatTimestamp(epochMs) {
        const time = moment(epochMs);
        if (scope.momentInterval === 'hour') {
          return time.format('MMMM Do YYYY, HH:mm');
        } else if (scope.momentInterval === 'second') {
          return time.format('MMMM Do YYYY, HH:mm:ss');
        } else {
          return time.format('MMMM Do YYYY');
        }
      }

    }
  };
});
