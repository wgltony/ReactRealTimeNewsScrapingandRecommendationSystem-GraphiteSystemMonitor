import _ from 'lodash';
import MissingRequiredError from './error_missing_required';
import moment from 'moment';

/*
 * Options object:
 * @param {Array} options.filters - additional filters to add to the `bool` section of the query. Default: []
 * @param {string} options.uuid - a UUID of the metric to filter for, or `null` if UUID should not be part of the query
 * @param {Date} options.start - numeric timestamp (optional)
 * @param {Date} options.end - numeric timestamp (optional)
 * @param {Metric} options.metric - Metric instance or metric fields object @see ElasticsearchMetric.getMetricFields
 */
export default function createQuery(options) {
  options = _.defaults(options, { filters: [] });
  let uuidFilter;
  // options.uuid can be null, for example getting all the clusters
  if (options.uuid) {
    const uuidField = _.get(options, 'metric.uuidField');
    if (!uuidField) {
      throw new MissingRequiredError('options.uuid given but options.metric.uuidField is false');
    }
    uuidFilter = { term: { [uuidField]: options.uuid } };
  }
  const timestampField = _.get(options, 'metric.timestampField');
  if (!timestampField) {
    throw new MissingRequiredError('metric.timestampField');
  }
  const timeRangeFilter = {
    range: {
      [timestampField]: {
        format: 'epoch_millis'
      }
    }
  };
  if (options.start) {
    timeRangeFilter.range[timestampField].gte = moment.utc(options.start).valueOf();
  }
  if (options.end) {
    timeRangeFilter.range[timestampField].lte = moment.utc(options.end).valueOf();
  }
  const filters = [uuidFilter, ...options.filters];
  if (options.end || options.start) {
    filters.push(timeRangeFilter);
  }
  return {
    bool: {
      filter: _.filter(filters, (val) => !_.isUndefined(val))
    }
  };
};
