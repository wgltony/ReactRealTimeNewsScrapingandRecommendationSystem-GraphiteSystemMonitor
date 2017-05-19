import url from 'url';
import {
  getUnhashableStatesProvider,
  unhashUrl,
} from 'ui/state_management/state_hashing';

import chrome from 'ui/chrome';
import UiModules from 'ui/modules';

UiModules.get('xpack/reporting')
.service('reportingDocumentControl', function ($http, Promise, Private, $location) {
  const getUnhashableStates = Private(getUnhashableStatesProvider);
  const mainEntry = '/api/reporting/generate';
  const reportPrefix = chrome.addBasePath(mainEntry);

  const docTypes = {
    discover: {
      getParams: (path) => path.match(/\/discover\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/search/${name}?${query}`,
    },
    visualize: {
      getParams: (path) => path.match(/\/visualize\/edit\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/visualization/${name}?${query}`,
    },
    dashboard: {
      getParams: (path) => path.match(/\/dashboard\/(.+)/),
      getReportUrl: (name, query) => `${reportPrefix}/dashboard/${name}?${query}`,
    },
  };

  function parseFromUrl() {
    // We need to convert the hashed states in the URL back into their original RISON values,
    // because this URL will be sent to the API.
    const urlWithHashes = window.location.href;
    const urlWithStates = unhashUrl(urlWithHashes, getUnhashableStates());
    const appUrlWithStates = urlWithStates.split('#')[1];

    const { pathname, query } = url.parse(appUrlWithStates, false);
    const pathParams = pathname.match(/\/([a-z]+)?(\/?.*)/);

    const type = pathParams[1];
    const docType = docTypes[type];

    // if the doc type is unknown, return an empty object, causing other checks to be falsy
    if (!docType) return {};

    const params = docType.getParams(pathname);
    const exportable = (!!params);
    const objectId = (exportable) ? params[1] : null;
    const reportPath = (exportable) ? docType.getReportUrl(objectId, query) : null;
    const reportUrl = (exportable) ? url.resolve($location.absUrl(), reportPath) : null;

    return {
      pathname,
      query,
      reportPath,
      reportUrl,
      objectId,
      exportable,
    };
  }

  this.getInfo = () => {
    return parseFromUrl();
  };

  this.isExportable = () => {
    return Boolean(this.getInfo().exportable);
  };

  this.getUrl = (opts = {}) => {
    const reportUrl = this.getInfo().reportUrl;
    if (!reportUrl) return null;

    if (opts.sync) {
      const parsed = url.parse(reportUrl);
      parsed.search = (parsed.search === null) ? 'sync' : `${parsed.search}&sync`;
      return url.format(parsed);
    }

    return reportUrl;
  };

  this.create = () => {
    const info = this.getInfo();
    if (!info.exportable) return Promise.reject(new Error('not exportable'));
    return $http.post(info.reportPath, {});
  };
});
