import modules from 'ui/modules';

const module = modules.get('reporting/job_queue');

module.service('reportingFeatureCheck', ($injector) => {
  return {
    shield() {
      return $injector.has('ShieldUser');
    }
  };
});
