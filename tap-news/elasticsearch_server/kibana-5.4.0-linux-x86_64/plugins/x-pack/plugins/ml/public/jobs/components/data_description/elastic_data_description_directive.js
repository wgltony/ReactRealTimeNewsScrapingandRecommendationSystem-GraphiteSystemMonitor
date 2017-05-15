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

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlElasticDataDescription', function () {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      ui:                 '=mlUi',
      properties:         '=mlProperties',
      dateProperties:     '=mlDateProperties',
      indexes:            '=mlIndexes',
      types:              '=mlTypes',
      mode:               '=mlMode',
      datafeed_config:    '=mlDatafeedConfig',
      data_description:   '=mlDataDescription',
      dataLoadedCallback: '=mlDataLoadedCallback',
      exposedFunctions:   '=mlExposedFunctions',
      serverInfo:         '=mlElasticServerInfo'
    },
    template: require('plugins/ml/jobs/components/data_description/elastic_data_description.html'),
    controller: function ($scope, $q, $location, mlJobService) {
      const MODE = { NEW: 0, EDIT: 1, CLONE: 2 };
      $scope.saveLock = false;
      let keyPressTimeout = null;

      $scope.timeFormatGuessed = false;
      $scope.exampleTime = '';

      const nonInfluencerTypes = [
        'numeric',
        'long',
        'integer',
        'short',
        'byte',
        'double',
        'float',
        'date',
        'boolean',
        'binary',
        'geo_point',
        'geo_shape',
        'completion',
        'token_count',
        'murmur3',
        'attachment'
      ];

      function init() {
        // allow the container (new_job_controller) to call some functions
        // when the JSON has been changed
        if ($scope.exposedFunctions) {
          $scope.exposedFunctions.extractFields = $scope.extractFields;
          $scope.exposedFunctions.getMappings = getMappings;
        }
        // if this is a datafeed job being cloned
        // load the indexes and types
        getMappings().then(() => {
          if ($scope.mode === MODE.CLONE && $scope.ui.isDatafeed) {
           // first load mappings, then extract types and fields.
            setUpClonedJob();
          }
        });
      }

      function setUpClonedJob() {
        // when cloning a job the types from the selected indexes haven't
        // been loaded. load these first and pass in fromClone=true so
        // the new types aren't ticked by default
        extractTypesFromIndexes(true);

        // create $scope.types by looping through the type names
        // in the cloning job object,
        _.each($scope.datafeed_config.types, (t) => {
          t = t.trim();
          $scope.types[t] = $scope.ui.types[t];
        });

        $scope.extractFields({ types: $scope.types });

        // callback once fields have been loaded
        // when cloning an elastic search based job, the callback is to a function to detect custom influencers
        if ($scope.dataLoadedCallback) {
          $scope.dataLoadedCallback();
        }
      }

      // quick function to get an array of type labels
      $scope.uiTypeKeys = function () {
        return Object.keys($scope.ui.types);
      };

      // function to delete an objects members
      // used rather than foo = {} as that destroys the reference in memory
      // $scope.properties is also bound to a different scope and references needs to
      // be retained
      function clear(obj) {
        Object.keys(obj).forEach((key) => { delete obj[key]; });
        if (Array.isArray(obj)) {
          obj.length = 0;
        }
      }

      $scope.extractFields = function (typesIn) {
        // typesIn gets passed in when types checkboxes get toggled
        // use this list, or empty the list entirely
        if (typesIn && typesIn.hasOwnProperty('types')) {
          $scope.types = typesIn.types;
        } else {
          clear($scope.types);
        }

        // empty the full list of types if no types were passed in
        // so we can keep track of whether we've seen a type before and whether to add it to
        // the checkbox list pre-ticked
        if (typesIn === undefined) {
          clear($scope.ui.types);
        }

        clear($scope.properties);
        clear($scope.dateProperties);
        clear($scope.ui.influencers);
        $scope.ui.indexTextOk = false;

        extractTypesFromIndexes();

        if ($scope.uiTypeKeys().length) {
          // diplay a green tick for indexes
          // diplay types selection
          $scope.ui.indexTextOk = true;
        }

        const ignoreFields = collectCopyToFields($scope.types);
        const flatFields = extractFlatFields($scope.types);
        _.each(flatFields, (prop, key) => {

          if (ignoreFields[key]) {
            return;
          }

          // add property (field) to list
          $scope.properties[key] = prop;
          if (prop.type === 'date') {
            // add date field to list of date fields
            $scope.dateProperties[key] = prop;
          }
        });

        const keys = Object.keys($scope.types);
        $scope.ui.datafeed.typesText  = keys.join(', ');
        // $scope.ui.influencers = Object.keys($scope.properties);

        // influencers is an array of property names.
        // properties of a certain type (nonInfluencerTypes) are rejected.
        _.each($scope.properties, (prop, key) => {
          if (prop.type && !_.findWhere(nonInfluencerTypes, prop.type)) {
            $scope.ui.influencers.push(key);
          }
        });

        if ($scope.mode === MODE.CLONE && $scope.ui.isDatafeed) {
          // when cloning a datafeed job, don't initially detect the time_field or format
          // just rely on the incoming settings
        } else {
          guessTimeField();
        }
      };


      // create $scope.ui.types based on the indexes selected
      // called when extracting fields and when cloning a job
      function extractTypesFromIndexes(fromClone) {
        if ($scope.ui.wizard.indexInputType === 'TEXT') {
          clear($scope.indexes);
          // parse comma separated list of indexes
          const indexes = $scope.ui.datafeed.indexesText.split(',');
          _.each(indexes, (ind) => {
            ind = ind.trim();
            // catch wildcard text entry
            ind = ind.replace(/\*/g, '.+');
            const reg = new RegExp('^' + ind + '$');

            _.each($scope.ui.indexes, (index, key) => {
              if (key.match(reg)) {
                $scope.indexes[key] = index;
                _.each(index.types, (type, i) => {
                  if (!fromClone && $scope.ui.types[i] === undefined) {
                    // if we've never seen this type before add it to the ticked list
                    $scope.types[i] = type;
                  }
                  $scope.ui.types[i] = type;
                });
              }
            });
          });

        } else { // choose indexes from tickbox list

          const keys = Object.keys($scope.indexes);
          $scope.ui.datafeed.indexesText  = keys.join(', ');

          _.each($scope.indexes, (index) => {
            _.each(index.types, (type, i) => {
              if (!fromClone && $scope.ui.types[i] === undefined) {
                // if we've never seen this type before add it to the ticked list
                $scope.types[i] = type;
              }
              $scope.ui.types[i] = type;
            });
          });
        }
      }

      $scope.getIndexesWithDelay = function () {
        $scope.ui.esServerOk = 2;
        window.clearTimeout(keyPressTimeout);
        keyPressTimeout = null;
        keyPressTimeout = window.setTimeout(() => {
          getMappings();
        }, 1000);
      };

      function getMappings() {
        const deferred = $q.defer();

        $scope.ui.validation.setTabValid(4, true);
        mlJobService.getESMappings()
        .then((indexes) => {
          $scope.ui.indexes  = filterIndexes(indexes);
          $scope.ui.esServerOk = 1;
          console.log('getMappings():', $scope.ui.indexes);

          if ($scope.mode === MODE.CLONE) {
            setUpClonedJob();
          }

          deferred.resolve();

        })
        .catch((err) => {
          console.log('getMappings:', err);
          if (err.statusCode) {
            if (err.statusCode === 401) {
              $scope.ui.validation.setTabValid(4, false);
            } else if (err.statusCode === 403) {
              $scope.ui.validation.setTabValid(4, false);
            } else {
              clearMappings();
            }
            $scope.ui.esServerOk = -1;
          } else {
            clearMappings();
          }

          deferred.reject();
        });

        function clearMappings() {
          $scope.ui.indexes = [];
          $scope.ui.esServerOk = -1;
          $scope.ui.datafeed.typesText = '';
          $scope.ui.datafeed.indexesText = '';
        }

        return deferred.promise;
      }

      function filterIndexes(idxs) {
        const indexes = {};
        const monitoringName = new RegExp('^\\.monitoring-.+');
        const dotName = new RegExp('^\\..+');
        _.each(idxs, (idx, key) => {
          // create a new collection only containing indexes
          // which don't start with a dot, except monitoring ones
          if (key.match(monitoringName) || !key.match(dotName)) {
            indexes[key] = idx;
          }
        });
        return indexes;
      }

      $scope.toggleIndex = function (key, index) {
        const idx = $scope.indexes[key];
        if (idx === undefined) {
          $scope.indexes[key] = index;
        } else {
          delete $scope.indexes[key];
        }

        $scope.extractFields();
        // console.log($scope.indexes);
        guessTimeField();
      };

      $scope.toggleTypes = function (key, index) {
        const idx = $scope.types[key];
        if (idx === undefined) {
          $scope.types[key] = index;
        } else {
          delete $scope.types[key];
        }

        $scope.extractFields({ types: $scope.types });
        // console.log($scope.types);
        guessTimeField();
      };

      $scope.toggleAllTypes = function () {
        // if all types are already selected, deselect all
        if ($scope.allTypesSelected()) {
          clear($scope.types);
        } else {
          // otherwsise, select all
          $scope.uiTypeKeys().forEach((key) => {
            $scope.types[key] = $scope.ui.types[key];
          });
        }

        // trigger field extraction and timeformat guessing
        $scope.extractFields({ types: $scope.types });
        guessTimeField();
      };

      $scope.allTypesSelected = function () {
        return ($scope.uiTypeKeys().length === Object.keys($scope.types).length);
      };

      function collectCopyToFields(data) {
        const result = {};
        function recurse(node, name) {
          if (name === 'copy_to') {
            if (Array.isArray(node)) {
              for (const p in node) {
                if (node.hasOwnProperty(p)) {
                  result[node[p]] = true;
                }
              }
            } else {
              result[node] = true;
            }
          } else if (Object(node) === node || Array.isArray(node)) {
            for (const child in node) {
              if (node.hasOwnProperty(child)) {
                recurse(node[child], child);
              }
            }
          }
        }
        recurse(data, '');
        return result;
      }

      function extractFlatFields(types) {
        const result = {};
        let currentType;
        function recurse(node, name, parentNode, parentName) {
          if (node && node.type && typeof node.type === 'string') {
            // node contains a type which is of type string
            node.__type = currentType;
            result[name] = node;
          } else if (Object(node) !== node) {
            // node is not an object, therefore must be a leaf
            // so add its parent to the result if the parent has a type of type string
            if (parentNode.type && typeof parentNode.type === 'string') {
              parentNode.__type = currentType;
              result[parentName] = parentNode;
            }
          } else if (Array.isArray(node)) {
            // skip mapping array
            return;
          } else {
            let isEmpty = true;
            for (const field in node) {
              if (node.hasOwnProperty(field)) {
                isEmpty = false;
                if (field === 'properties') {
                  // enter properties object, but don't add 'properties' to the dot notation chain
                  recurse(node[field], name, parentNode, parentName);
                } else {
                  // enter object, building up a dot notation chain of names
                  recurse(node[field], name ? name + '.' + field : field, node, name);
                }
              }
              if (isEmpty && name) {
                result[name] = node;
              }
            }
          }
        }
        _.each(types, (type, i) => {
          currentType = i;
          recurse(type, '', '');
        });
        return result;
      }

      function guessTimeField() {
        let match = $scope.data_description.time_field;
        if ($scope.dateProperties[match] === undefined) {
          match = '';
        }
        _.each($scope.dateProperties, (prop, i) => {
          // loop through dateProperties and find the first item that matches 'time'
          if (match === '' && i.match('time')) {
            match = i;
          }
        });
        if (match !== '') {
          $scope.data_description.time_field = match;
          console.log('guessTimeField: guessed time fields: ', match);
        }
      }

      init();
    }
  };
});
