import uiModules from 'ui/modules';

const uiModule = uiModules.get('monitoring/license', []);
uiModule.service('license', () => {
  let licenseType;

  return {
    isBasic() {
      return licenseType === 'basic';
    },
    setLicenseType(newType) {
      licenseType = newType;
    }
  };
});
