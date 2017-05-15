import React from 'react';

const make = React.DOM;

export default React.createClass({
  displayName: 'TableHead',
  render: function () {
    const that = this;
    function makeTh(config) {
      const isSortCol = config.sort !== 0 && config.sort;
      const isSortAsc = config.sort === 1;
      let $icon = false;
      if (isSortCol) {
        const iconClassName = 'fa fa-sort-amount-' + (isSortAsc ? 'asc' : 'desc');
        $icon = make.span(null, [
          make.span({ key: 'iconspace' }, ' '),
          make.span({ key: 'icon', className: iconClassName })
        ]);
      }

      return make.th({
        key: config.title,
        onClick: function () {
          if (config.sort !== 0) {
            config.sort = config.sort === 1 ? -1 : 1;
          } else {
            config.sort = 1;
          }
          that.props.setSortCol(config);
        },
        className: config.className || ''
      }, config.title, $icon);
    }
    const $ths = this.props.columns.map(makeTh);
    return make.thead(null, make.tr(null, $ths));
  }
});
