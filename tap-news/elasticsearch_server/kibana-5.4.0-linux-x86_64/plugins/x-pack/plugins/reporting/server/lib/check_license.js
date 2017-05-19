export function checkLicense(xpackLicenseInfo) {
  // If, for some reason, we cannot get the license information
  // from Elasticsearch, assume worst case and disable reporting
  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    return {
      showLinks: true,
      enableLinks: false,
      message: 'You cannot use Reporting because license information is not available at this time.'
    };
  }

  const VALID_LICENSE_MODES_TO_ENABLE_REPORTING = [
    'trial',
    'standard',
    'gold',
    'platinum'
  ];

  const isLicenseModeValid = xpackLicenseInfo.license.isOneOf(VALID_LICENSE_MODES_TO_ENABLE_REPORTING);
  const isLicenseActive = xpackLicenseInfo.license.isActive();

  // License is not valid
  if (!isLicenseModeValid) {
    return {
      showLinks: false,
      message: `Your ${xpackLicenseInfo.license.getType()} license does not support Reporting. Please upgrade your license.`
    };
  }

  // License is valid but not active
  if (!isLicenseActive) {
    return {
      showLinks: true,
      enableLinks: false,
      message: `You cannot use Reporting because your ${xpackLicenseInfo.license.getType()} license has expired.`
    };
  }

  // License is valid and active
  return {
    showLinks: true,
    enableLinks: true
  };
};