import React from 'react';
import moment from 'moment-timezone';
import { capitalize } from 'lodash';

export default function LicenseText(props) {
  const formatDateLocal = (input) => {
    return moment.tz(input, moment.tz.guess()).format('LL');
  };

  const goToLicense = () => props.angularChangeUrl('/license');

  if (props.license && props.showLicenseExpiration) {
    return (
      <div className='page-row'>
        <div className='page-row-text'>
          Your { capitalize(props.license.type)
          } license will expire on <a className='link' onClick={goToLicense}> {
          formatDateLocal(props.license.expiry_date) }.</a>
        </div>
      </div>
    );
  }

  return null;
}
