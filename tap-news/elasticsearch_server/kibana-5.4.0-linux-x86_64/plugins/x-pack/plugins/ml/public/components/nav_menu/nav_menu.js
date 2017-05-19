import _ from 'lodash';
import template from './nav_menu.html';
import chrome from 'ui/chrome';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.directive('mlNavMenu', () => {
  return {
    restrict: 'E',
    transclude: true,
    template,
    link: function (scope, el, attrs) {

      // Tabs
      scope.name = attrs.name;

      scope.showTabs = false;
      if (scope.name === 'jobs' ||
          scope.name === 'timeseriesexplorer' ||
          scope.name === 'explorer') {
        scope.showTabs = true;
      }
      scope.isActiveTab = function (path) {
        return scope.name === path;
      };

      // Breadcrumbs
      const crumbNames = {
        jobs: { label: 'Job Management', url: '#/jobs' },
        new_job: { label: 'Create New Job', url: '#/jobs/new_job' },
        new_job_single_metric: { label: 'Single Metric Job', url: '#/jobs/new_job_single_metric' },
        new_job_multi_metric: { label: 'Multi Metric job', url: '#/jobs/new_job_multi_metric' },
        new_job_advanced: { label: 'Advanced Job Configuration', url: '#/jobs/new_job_advanced' },
        explorer: { label: 'Anomaly Explorer', url: '#/explorer' },
        timeseriesexplorer: { label: 'Single Metric Viewer', url: '#/timeseriesexplorer' },
      };

      const breadcrumbs = [{ label: 'Machine Learning (Beta)', url: '#/' }];

      // get crumbs from url
      const crumbs = chrome.getBreadcrumbs();
      _.each(crumbs, (crumb) => {
        if (crumb !== 'step' && crumb !== '1' && crumb !== 'create') {
          if (crumb === 'new_job_single_metric' ||
              crumb === 'new_job_multi_metric' ||
              crumb === 'new_job_advanced') {
            // if creating a new job, push the new_job step into the trail
            breadcrumbs.push(crumbNames.new_job);
          }
          breadcrumbs.push(crumbNames[crumb]);
        }
      });
      scope.breadcrumbs = breadcrumbs.filter(Boolean);
    }
  };
});
