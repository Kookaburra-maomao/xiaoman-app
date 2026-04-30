/**
 * Expo Config Plugin: 修复 IAP 头文件搜索路径
 * 在 pod install 后自动给所有 target 添加 $(inherited) 头文件路径
 * 解决 EXInAppPurchases 中找不到 EXEventEmitterService.h 的问题
 */
const { withXcodeProject } = require('@expo/config-plugins');

function fixHeaderSearchPaths(xcodeProject) {
  // 获取所有 target 的 build settings
  const targets = Object.keys(xcodeProject.pbxNativeTarget());
  
  targets.forEach((targetId) => {
    const target = xcodeProject.pbxNativeTarget()[targetId];
    if (!target) return;

    const buildConfigList = target.buildConfigurationList;
    const buildConfigs = xcodeProject.getPBXObject('XCConfigurationList')[buildConfigList]?.buildConfigurations || [];

    buildConfigs.forEach((configId) => {
      const config = xcodeProject.getPBXObject('XCBuildConfiguration')[configId];
      if (!config?.buildSettings) return;

      const paths = config.buildSettings.HEADER_SEARCH_PATHS;
      if (!paths) {
        config.buildSettings.HEADER_SEARCH_PATHS = ['$(inherited)'];
      } else if (typeof paths === 'string') {
        if (!paths.includes('$(inherited)')) {
          config.buildSettings.HEADER_SEARCH_PATHS = `$(inherited) ${paths}`;
        }
      } else if (Array.isArray(paths)) {
        if (!paths.includes('$(inherited)')) {
          config.buildSettings.HEADER_SEARCH_PATHS = ['$(inherited)', ...paths];
        }
      }
    });
  });

  return xcodeProject;
}

module.exports = function withIAPFix(config) {
  return withXcodeProject(config, async (config) => {
    config.modResults = fixHeaderSearchPaths(config.modResults);
    return config;
  });
};
