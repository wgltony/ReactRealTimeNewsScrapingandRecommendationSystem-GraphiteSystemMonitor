import 'plugins/reporting/directives/export_config';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import navbarExtensions from 'ui/registry/navbar_extensions';

function discoverReportProvider(Private) {
  const xpackInfo = Private(XPackInfoProvider);
  return {
    appName: 'discover',

    key: 'reporting-discover',
    label: 'Reporting',
    template: '<export-config object-type="Search"></export-config>',
    description: 'Search Report',
    hideButton: () => !xpackInfo.get('features.reporting.showLinks', false),
    disableButton: () => !xpackInfo.get('features.reporting.enableLinks', false),
    tooltip: () => xpackInfo.get('features.reporting.message')
  };
}

navbarExtensions.register(discoverReportProvider);
