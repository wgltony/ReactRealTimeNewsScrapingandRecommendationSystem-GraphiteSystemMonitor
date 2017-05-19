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

// work out the default frequency based on the bucket_span in seconds
function calculateDatafeedFrequencyDefaultSeconds(bucketSpanSeconds) {

  let freq = 3600;
  if (bucketSpanSeconds <= 120) {
    freq = 60;
  } else if (bucketSpanSeconds <= 1200) {
    freq = Math.floor(bucketSpanSeconds / 2);
  } else if (bucketSpanSeconds <= 43200) {
    freq = 600;
  }

  return freq;
}

// Returns a flag to indicate whether the job is suitable for viewing
// in the Time Series dashboard.
function isTimeSeriesViewJob(job) {
  // only single metric jobs with model plot data and with only one detector with
  // no by/over/partition fields can currently be viewed in the Time Series dashboard
  let isViewable = false;
  const dtrs = job.analysis_config.detectors;
  if (job.model_plot_config !== undefined && dtrs.length === 1) {
    const firstDtr = dtrs[0];
    if (firstDtr.partition_field_name === undefined &&
        firstDtr.by_field_name === undefined &&
        firstDtr.over_field_name === undefined) {
      isViewable = true;
    }
  }
  return isViewable;
}

export default {
  calculateDatafeedFrequencyDefaultSeconds: calculateDatafeedFrequencyDefaultSeconds,
  isTimeSeriesViewJob: isTimeSeriesViewJob
};
