import { get } from 'lodash';
import 'plugins/reporting/services/document_control';
import './export_config.less';
import template from 'plugins/reporting/directives/export_config/export_config.html';
import Notifier from 'ui/notify/notifier';
import modules from 'ui/modules';

const module = modules.get('xpack/reporting');

module.directive('exportConfig', (reportingDocumentControl) => {
  const reportingNotifier = new Notifier({ location: 'Reporting' });

  return {
    restrict: 'E',
    scope: {},
    require: ['?^dashboardApp', '?^visualizeApp', '?^discoverApp'],
    controllerAs: 'exportConfig',
    template,
    link($scope, $el, $attr, controllers) {
      const isDirty = () => controllers.some(ctrl => get(ctrl, 'appStatus.dirty', false));
      $scope.exportConfig.isExportable = () => !isDirty() && reportingDocumentControl.isExportable();
      $scope.exportConfig.selectedType = 'printablePdf';
      $scope.exportConfig.name = $attr.name;
      $scope.exportConfig.objectType = $attr.objectType;

      $scope.exportConfig.exportTypes = {
        printablePdf: {
          name: 'PDF',
          link: reportingDocumentControl.getUrl(),
        }
      };
    },
    controller($document) {
      this.export = (type) => {
        switch (type) {
          case 'printablePdf':
            return reportingDocumentControl.create()
            .then(() => {
              reportingNotifier.info(`${this.objectType} generation has been queued. You can track its progress under Management.`);
            })
            .catch((err) => {
              if (err.message === 'not exportable') {
                return reportingNotifier.warning('Only saved dashboards can be exported. Please save your work first.');
              }

              reportingNotifier.error(err);
            });
          default:
            reportingNotifier.error(`Invalid export type specified: ${type}`);

        }
      };

      this.copyToClipboard = selector => {
        // Select the text to be copied. If the copy fails, the user can easily copy it manually.
        const copyTextarea = $document.find(selector)[0];
        copyTextarea.select();

        try {
          const isCopied = document.execCommand('copy');
          if (isCopied) {
            reportingNotifier.info('URL copied to clipboard.');
          } else {
            reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
          }
        } catch (err) {
          reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
        }
      };
    }
  };
});
