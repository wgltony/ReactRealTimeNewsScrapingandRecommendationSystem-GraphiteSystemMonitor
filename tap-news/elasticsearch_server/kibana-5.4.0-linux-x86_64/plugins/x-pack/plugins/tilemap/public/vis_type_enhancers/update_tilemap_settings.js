import uiRoutes from 'ui/routes';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import 'ui/vis_maps/lib/tilemap_settings';

uiRoutes.addSetupWork(function (Private, tilemapSettings) {

  const xpackInfo = Private(XPackInfoProvider);
  const tileMapPluginInfo = xpackInfo.get('features.tilemap');

  if (!tileMapPluginInfo) {
    return;
  }

  if (!tileMapPluginInfo.license.active || !tileMapPluginInfo.license.valid) {
    return;
  }
  tilemapSettings.addQueryParams({ license: tileMapPluginInfo.license.uid });

});
