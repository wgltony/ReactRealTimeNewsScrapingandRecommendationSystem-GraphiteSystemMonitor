import Boom from 'boom';
import { oncePerServer } from './once_per_server';

function licensePreRoutingFn(server) {
  const xpackMainPlugin = server.plugins.xpack_main;
  const pluginId = 'reporting';

  // License checking and enable/disable logic
  function licensePreRouting(request, reply) {
    const licenseCheckResults = xpackMainPlugin.info.feature(pluginId).getLicenseCheckResults();
    if (!licenseCheckResults.showLinks || !licenseCheckResults.enableLinks) {
      reply(Boom.forbidden(licenseCheckResults.message));
    } else {
      reply();
    }
  };

  return licensePreRouting;
}

export const licensePreRoutingFactory = oncePerServer(licensePreRoutingFn);

