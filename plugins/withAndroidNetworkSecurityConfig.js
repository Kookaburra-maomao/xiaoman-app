const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo 配置插件：配置 Android 网络安全策略
 * 允许 HTTP 明文流量
 */
const withAndroidNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // 1. 在 application 标签中添加 usesCleartextTraffic 和 networkSecurityConfig
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
    
    // 添加 usesCleartextTraffic
    mainApplication.$['android:usesCleartextTraffic'] = 'true';
    
    // 添加 networkSecurityConfig
    mainApplication.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    return config;
  });
};

module.exports = withAndroidNetworkSecurityConfig;
