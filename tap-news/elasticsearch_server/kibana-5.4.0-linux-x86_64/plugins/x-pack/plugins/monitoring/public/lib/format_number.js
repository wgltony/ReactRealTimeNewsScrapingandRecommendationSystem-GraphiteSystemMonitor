import moment from 'moment';
import numeral from 'numeral';

export function formatBytesUsage(used, max) {
  return formatNumber(used, 'bytes') + ' / ' + formatNumber(max, 'bytes');
}

export function formatPercentageUsage(used, max) {
  return formatNumber(used / max, '0.00%');
}

export default function formatNumber(num, which) {
  if (typeof num === 'undefined' || isNaN(num)) { return 0; }
  if (typeof num !== 'number') { return num; }
  let format = '0,0.0';
  let postfix = '';
  switch (which) {
    case 'time_since':
      return moment(moment() - num).from(moment(), true);
    case 'time':
      return moment(num).format('H:mm:ss');
    case 'int_commas':
      format = '0,0';
      break;
    case 'byte':
      format += 'b';
      break;
    case 'ms':
      postfix = 'ms';
      break;
    default:
      if (which) format = which;
  }
  return numeral(num).format(format) + postfix;
};
