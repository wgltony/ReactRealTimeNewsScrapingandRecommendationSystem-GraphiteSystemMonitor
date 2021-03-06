import { capitalize } from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { formatDateTimeLocal } from 'monitoring-formatting';
import uiModules from 'ui/modules';
import Table from 'plugins/monitoring/components/paginated_table';
import { SORT_DESCENDING } from 'monitoring-constants';
import Tooltip from 'plugins/monitoring/components/tooltip';
import FormattedMessage from 'plugins/monitoring/components/alerts/formatted_message';
import { SeverityIcon } from 'plugins/monitoring/components/alerts/severity_icon';
import { mapSeverity } from 'plugins/monitoring/components/alerts/map_severity';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringClusterAlertsListing', function (kbnUrl) {
  const tableOptions = {
    searchPlaceholder: 'Filter Alerts',
    filterFields: ['message', 'prefix', 'suffix', 'update_timestamp', 'severity_group'],
    noDataMessage: 'There are currently no active cluster alerts.',
    columns: [
      { key: 'metadata.severity', title: 'Status', sort: SORT_DESCENDING }, // desc. order for worst on top
      { key: 'message', title: 'Message' },
      { key: 'update_timestamp', title: 'Time' }
    ]
  };
  const localizeDate = (date) => {
    return formatDateTimeLocal(date);
  };

  return {
    restrict: 'E',
    scope: { alerts: '=' },
    link(scope, $el) {
      function AlertRow(props) {
        const angularChangeUrl = (target) => {
          scope.$evalAsync(() => {
            kbnUrl.changePath(target);
          });
        };

        return (
          <tr className='big'>
            <td>
              <Tooltip text={`${capitalize(props.severity_group)} severity alert`} placement='bottom' trigger='hover'>
                <SeverityIcon severity={props.metadata.severity} />
              </Tooltip>
            </td>
            <td>
              <FormattedMessage
                prefix={props.prefix}
                suffix={props.suffix}
                message={props.message}
                metadata={props.metadata}
                angularChangeUrl={angularChangeUrl}
              />
            </td>
            <td>
              {localizeDate(props.update_timestamp)}
            </td>
          </tr>
        );
      }

      const tableInstance = ReactDOM.render(
        <Table options={tableOptions} template={AlertRow}/>,
        $el[0]
      );
      const alertMapper = (alert) => {
        return Object.assign(
          alert,
          { severity_group: mapSeverity(alert.metadata.severity) } // for table filtering
        );
      };

      scope.$watch('alerts', (alerts) => {
        tableInstance.setData(alerts.map(alertMapper));
      });
    }
  };
});
