import uiModules from 'ui/modules';
import template from './tool_bar_search_box.html';

const app = uiModules.get('xpack/watcher');

app.directive('toolBarSearchBox', function () {
  return {
    restrict: 'E',
    replace: true,
    template: template,
    scope: {
      query: '=',
      onQueryChange: '=',
    },
    controllerAs: 'toolBarSearchBox',
    bindToController: true,
    controller: class ToolBarSearchBoxController {
      constructor($scope) {
        $scope.$watch('toolBarSearchBox.query', this.onQueryChange);
      }
    }
  };
});
