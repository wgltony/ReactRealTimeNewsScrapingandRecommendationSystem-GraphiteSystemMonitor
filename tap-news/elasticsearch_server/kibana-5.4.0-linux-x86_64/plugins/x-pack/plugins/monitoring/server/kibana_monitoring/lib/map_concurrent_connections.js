import _ from 'lodash';

export default function mapConcurrents(concurrents) {
  return _.reduce(_.values(concurrents), (result, value) => {
    return result + value;
  }, 0);
}
