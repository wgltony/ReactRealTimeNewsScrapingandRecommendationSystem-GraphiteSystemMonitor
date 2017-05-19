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
 * Builds the configuration object used to plot a chart showing where the anomalies occur in
 * the raw data in the Explorer dashboard.
 */

const _ = require('lodash');

import parseInterval from 'ui/utils/parse_interval';
import { aggregationTypeTransform } from 'plugins/ml/util/anomaly_utils';

export default function explorerChartConfigBuilder(mlJobService) {

  const compiledTooltip = _.template(
    '<div class="explorer-chart-info-tooltip">job ID: <%= jobId %><br/>' +
    'aggregation interval: <%= aggregationInterval %><br/>' +
    'chart function: <%= chartFunction %></div>');

  // Builds the chart configuration for the provided anomaly record, returning
  // an object with properties used for the display (series function and field, aggregation interval etc),
  // and properties for the data feed used for the job (index pattern, time field etc).
  function buildConfig(record) {
    const job = mlJobService.getJob(record.job_id);

    const config = {
      jobId: record.job_id,
      detectorIndex: record.detector_index,
      function: record.function_description,
      metricFunction: aggregationTypeTransform.toES(record.function_description),
      timeField: job.data_description.time_field,
      bucketSpanSeconds: parseInterval(job.analysis_config.bucket_span).asSeconds(),
      interval: job.analysis_config.bucket_span
    };

    config.detectorLabel = record.function;
    const detectorIndex = record.detector_index;
    if ((_.has(mlJobService.detectorsByJob, record.job_id)) &&
      (detectorIndex < mlJobService.detectorsByJob[record.job_id].length)) {
      config.detectorLabel = mlJobService.detectorsByJob[record.job_id][detectorIndex].detector_description;
    } else {
      if (record.field_name !== undefined) {
        config.detectorLabel += ' ';
        config.detectorLabel += config.fieldName;
      }
    }

    if (record.field_name !== undefined) {
      config.fieldName = record.field_name;
      config.metricFieldName = record.field_name;
    }

    // Extra checks if the job config uses a summary count field.
    const summaryCountFieldName = job.analysis_config.summary_count_field_name;
    if (record.function_description === 'count' && summaryCountFieldName !== undefined
      && summaryCountFieldName !== 'doc_count') {
      // Check for a detector looking at cardinality (distinct count) using an aggregation.
      // The cardinality field will be in:
      // aggregations/<agg_name>/aggregations/<summaryCountFieldName>/cardinality/field
      // or aggs/<agg_name>/aggs/<summaryCountFieldName>/cardinality/field
      let cardinalityField = undefined;
      const topAgg = _.get(job.datafeed_config, 'aggregations') || _.get(job.datafeed_config, 'aggs');
      if (topAgg !== undefined && _.values(topAgg).length > 0) {
        cardinalityField = _.get(_.values(topAgg)[0], ['aggregations', summaryCountFieldName, 'cardinality', 'field']) ||
          _.get(_.values(topAgg)[0], ['aggs', summaryCountFieldName, 'cardinality', 'field']);
      }

      if (record.function === 'non_zero_count' && cardinalityField !== undefined) {
        config.metricFunction = 'cardinality';
        config.metricFieldName = cardinalityField;
      } else {
        // For count detectors using summary_count_field, plot sum(summary_count_field_name)
        config.metricFunction = 'sum';
        config.metricFieldName = summaryCountFieldName;
      }
    }

    // Add the 'entity_fields' i.e. the partition, by, over fields which
    // define the metric series to be plotted.
    config.entityFields = [];
    if (_.has(record, 'partition_field_name')) {
      config.entityFields.push({ fieldName: record.partition_field_name, fieldValue: record.partition_field_value });
    }

    if (_.has(record, 'over_field_name')) {
      config.entityFields.push({ fieldName: record.over_field_name, fieldValue: record.over_field_value });
    }

    // For jobs with by and over fields, don't add the 'by' field as this
    // field will only be added to the top-level fields for record type results
    // if it also an influencer over the bucket.
    if (_.has(record, 'by_field_name') && !(_.has(record, 'over_field_name'))) {
      config.entityFields.push({ fieldName: record.by_field_name, fieldValue: record.by_field_value });
    }

    // Obtain the raw data index(es) from the job datafeed_config.
    if (job.datafeed_config) {
      config.datafeedConfig = job.datafeed_config;
    }

    // Build the tooltip for the chart info icon, showing further details on what is being plotted.
    let functionLabel = config.metricFunction;
    if (config.metricFieldName !== undefined) {
      functionLabel += ' ';
      functionLabel += config.metricFieldName;
    }

    config.infoTooltip = compiledTooltip({
      'jobId':record.job_id,
      'aggregationInterval': job.analysis_config.bucket_span,
      'chartFunction': functionLabel
    });

    return config;
  }


  return {
    buildConfig
  };
}

