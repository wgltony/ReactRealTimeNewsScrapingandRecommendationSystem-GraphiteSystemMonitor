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

import './http_service';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('ml', function (prlHttpService) {
  const http = prlHttpService;

  this.jobs = function (obj) {
    const jobId = (obj && obj.jobId) ? obj.jobId : '';
    return http.request({
      url: `../api/ml/anomaly_detectors/${jobId}`,
    });
  };

  this.jobStats = function (obj) {
    const jobId = (obj && obj.jobId) ? obj.jobId + '/' : '';
    return http.request({
      url: `../api/ml/anomaly_detectors/${jobId}_stats`,
    });
  };

  this.addJob = function (obj) {
    return http.request({
      url: `../api/ml/anomaly_detectors/${obj.jobId}`,
      method: 'PUT',
      data: obj.job
    });
  };

  this.openJob = function (obj) {
    return http.request({
      url: `../api/ml/anomaly_detectors/${obj.jobId}/_open`,
      method: 'POST'
    });
  };

  this.closeJob = function (obj) {
    return http.request({
      url: `../api/ml/anomaly_detectors/${obj.jobId}/_close`,
      method: 'POST'
    });
  };

  this.deleteJob = function (obj) {
    return http.request({
      url: `../api/ml/anomaly_detectors/${obj.jobId}`,
      method: 'DELETE'
    });
  };

  this.updateJob = function (obj) {
    return http.request({
      url: `../api/ml/anomaly_detectors/${obj.jobId}/_update`,
      method: 'POST',
      data: obj.job
    });
  };

  this.datafeeds = function (obj) {
    const datafeedId = (obj && obj.datafeedId) ? obj.datafeedId : '';
    return http.request({
      url: `../api/ml/datafeeds/${datafeedId}`,
    });
  };

  this.datafeedStats = function (obj) {
    const datafeedId = (obj && obj.datafeedId) ? obj.datafeedId + '/' : '';
    return http.request({
      url: `../api/ml/datafeeds/${datafeedId}_stats`,
    });
  };

  this.addDatafeed = function (obj) {
    return http.request({
      url: `../api/ml/datafeeds/${obj.datafeedId}`,
      method: 'PUT',
      data: obj.datafeedConfig
    });
  };

  this.updateDatafeed = function (obj) {
    return http.request({
      url: `../api/ml/datafeeds/${obj.datafeedId}/_update`,
      method: 'POST',
      data: obj.datafeedConfig
    });
  };

  this.deleteDatafeed = function (obj) {
    return http.request({
      url: `../api/ml/datafeeds/${obj.datafeedId}`,
      method: 'DELETE'
    });
  };

  this.startDatafeed = function (obj) {
    const data = {};
    if(obj.start !== undefined) {
      data.start = obj.start;
    }
    if(obj.end !== undefined) {
      data.end = obj.end;
    }
    return http.request({
      url: `../api/ml/datafeeds/${obj.datafeedId}/_start`,
      method: 'POST',
      data
    });
  };

  this.stopDatafeed = function (obj) {
    return http.request({
      url: `../api/ml/datafeeds/${obj.datafeedId}/_stop`,
      method: 'POST'
    });
  };

  this.datafeedPreview = function (obj) {
    return http.request({
      url: `../api/ml/datafeeds/${obj.datafeedId}/_preview`,
      method: 'GET'
    });
  };

  this.validateDetector = function (obj) {
    return http.request({
      url: '../api/ml/anomaly_detectors/_validate/detector',
      method: 'POST',
      data: obj.detector
    });
  };

  this.checkPrivilege = function (obj) {
    return http.request({
      url: '../api/ml/_has_privileges',
      method: 'POST',
      data: obj
    });
  };

});
