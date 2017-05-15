import { escape } from 'lodash';
export default function normalizeVersionString(string) {
  if (string) {
    // get just the number.number.number portion (filter out '-snapshot')
    const matches = string.match(/^\d+\.\d+.\d+/);
    if (matches) {
      // escape() because the string could be rendered in UI
      return escape(matches[0]);
    }
  }

  return '';
}
