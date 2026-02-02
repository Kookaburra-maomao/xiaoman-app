const { withDangerousMod, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo 配置插件：复制网络安全配置文件到 Android 项目
 */
const withAndroidNetworkSecurityConfigFile = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;
      
      // 源文件路径
      const sourceFile = path.join(projectRoot, 'network_security_config.xml');
      
      // 目标文件路径
      const targetDir = path.join(platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      const targetFile = path.join(targetDir, 'network_security_config.xml');
      
      // 确保目标目录存在
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // 复制文件
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        console.log('✅ 网络安全配置文件已复制到:', targetFile);
      } else {
        console.warn('⚠️  未找到网络安全配置文件:', sourceFile);
      }
      
      return config;
    },
  ]);
};

module.exports = withAndroidNetworkSecurityConfigFile;
