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

import 'ui/courier';
import 'ui-bootstrap';
import 'ui/persisted_log';
import 'ui/autoload/all';

import 'plugins/ml/lib/angular_bootstrap_patch';
import 'plugins/ml/jobs/index';
import 'plugins/ml/services/ml_clipboard_service';
import 'plugins/ml/services/privilege_service';
import 'plugins/ml/services/job_service';
import 'plugins/ml/services/ml_api_service';
import 'plugins/ml/services/browser_detect_service';
import 'plugins/ml/services/ml_dashboard_service';
import 'plugins/ml/services/results_service';
import 'plugins/ml/components/messagebar';
import 'plugins/ml/explorer';
import 'plugins/ml/timeseriesexplorer';
import 'plugins/ml/components/json_tooltip';
import 'plugins/ml/components/engine_api_help_link';
import 'plugins/ml/components/confirm_modal';
import 'plugins/ml/components/pretty_duration';
import 'plugins/ml/components/nav_menu';

import chrome from 'ui/chrome';
import uiRoutes from 'ui/routes';

if (typeof uiRoutes.enable === 'function') {
  uiRoutes.enable();
}

uiRoutes
.otherwise({
  redirectTo: `/${chrome.getInjected('kbnDefaultAppId', 'jobs')}`
});

