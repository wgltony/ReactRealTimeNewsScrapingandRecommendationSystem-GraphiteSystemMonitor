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

// simple check for browser name

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.service('mlBrowserDetectService', function ($window) {

  return function () {

    const userAgent = $window.navigator.userAgent;

    const browsers = {
      chrome: /chrome/i,
      safari: /safari/i,
      firefox: /firefox/i,
      ie: /internet explorer/i
    };

    for (const key in browsers) {
      if (browsers.hasOwnProperty(key)) {
        if (browsers[key].test(userAgent)) {
          return key;
        }
      }
    }

    return 'unknown';
  };
});
