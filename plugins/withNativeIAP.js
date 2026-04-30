/**
 * Expo Config Plugin: 添加原生 IAP 模块
 * prebuild 后将 IAPManager.swift/.m 复制到 ios/app/ 目录
 * Xcode 会自动包含 ios/app/ 目录下的 .swift 和 .m 文件
 */
const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withNativeIAP(config) {
  // 在 prebuild 完成后复制原生文件
  config = withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosAppDir = path.join(projectRoot, 'ios', 'app');
    const pluginDir = path.join(projectRoot, 'plugins', 'iap-native');
    
    // 确保 ios/app 目录存在
    if (!fs.existsSync(iosAppDir)) {
      fs.mkdirSync(iosAppDir, { recursive: true });
    }
    
    // 复制 IAPManager.swift
    const swiftSrc = path.join(pluginDir, 'IAPManager.swift');
    const swiftDst = path.join(iosAppDir, 'IAPManager.swift');
    if (fs.existsSync(swiftSrc)) {
      fs.copyFileSync(swiftSrc, swiftDst);
      console.log('[withNativeIAP] Copied IAPManager.swift -> ios/app/');
    } else {
      console.log('[withNativeIAP] WARN: IAPManager.swift not found at', swiftSrc);
    }
    
    // 复制 IAPManager.m（OC 桥接）
    const objcSrc = path.join(pluginDir, 'IAPManager.m');
    const objcDst = path.join(iosAppDir, 'IAPManager.m');
    if (fs.existsSync(objcSrc)) {
      fs.copyFileSync(objcSrc, objcDst);
      console.log('[withNativeIAP] Copied IAPManager.m -> ios/app/');
    }
    
    // 确保 bridging header 包含 StoreKit import
    const headerDst = path.join(iosAppDir, 'app-Bridging-Header.h');
    const headerSrc = path.join(pluginDir, 'app-Bridging-Header.h');
    if (fs.existsSync(headerSrc)) {
      const headerContent = fs.readFileSync(headerSrc, 'utf-8');
      if (fs.existsSync(headerDst)) {
        const existing = fs.readFileSync(headerDst, 'utf-8');
        if (!existing.includes('StoreKit')) {
          fs.writeFileSync(headerDst, headerContent + '\n' + existing);
        }
      } else {
        fs.writeFileSync(headerDst, headerContent);
      }
      console.log('[withNativeIAP] Updated Bridging Header');
    }
    
    // 添加 StoreKit framework 到 Xcode 项目
    const xcodeProject = config.modResults;
    if (xcodeProject && typeof xcodeProject.addFramework === 'function') {
      try {
        xcodeProject.addFramework('StoreKit.framework', { weak: true });
      } catch (e) {
        // already exists
      }
    }
    
    return config;
  });
  
  return config;
};
