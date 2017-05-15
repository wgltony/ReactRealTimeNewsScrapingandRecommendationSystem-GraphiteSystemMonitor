import _ from 'lodash';

export default function pickMetricFields(metric) {
  const fields = [
    'app',
    'field',
    'label',
    'title',
    'description',
    'units',
    'format'
  ];
  return _.pick(metric, fields);
};
