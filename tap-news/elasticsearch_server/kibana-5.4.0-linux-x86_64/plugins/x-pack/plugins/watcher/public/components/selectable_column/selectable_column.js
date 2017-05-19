import uiModules from 'ui/modules';
import template from './selectable_column.html';

const app = uiModules.get('xpack/watcher');

app.directive('selectableColumn', function () {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template: template,
    scope: {
      selected: '=',
      onSelectAllChange: '='
    },
    controllerAs: 'selectableColumn',
    bindToController: true,
    controller: class SelectableColumnController {
    }
  };
});
