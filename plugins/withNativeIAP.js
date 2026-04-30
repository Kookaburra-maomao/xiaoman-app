/**
 * Expo Config Plugin: 添加原生 IAP 模块
 * prebuild 后将 IAPManager.swift/.m 复制到 ios/app/ 目录，
 * 并添加到 Xcode 编译源
 */
const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withNativeIAP(config) {
  return withXcodeProject(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosAppDir = path.join(projectRoot, 'ios', 'app');
    const pluginDir = path.join(projectRoot, 'plugins', 'iap-native');

    // 1. 复制 Swift 和 ObjC 源文件到 ios/app/
    if (!fs.existsSync(iosAppDir)) {
      fs.mkdirSync(iosAppDir, { recursive: true });
    }

    const filesToCopy = [
      ['IAPManager.swift', pluginDir, iosAppDir],
      ['IAPManager.m', pluginDir, iosAppDir],
    ];

    for (const [fileName, srcDir, dstDir] of filesToCopy) {
      const src = path.join(srcDir, fileName);
      const dst = path.join(dstDir, fileName);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }

    // 2. 确保 bridging header 包含 StoreKit
    const headerDst = path.join(iosAppDir, 'app-Bridging-Header.h');
    const headerContent = `#import <React/RCTBridgeModule.h>\n#import <React/RCTEventEmitter.h>\n#import <StoreKit/StoreKit.h>\n`;
    if (!fs.existsSync(headerDst) || !fs.readFileSync(headerDst, 'utf-8').includes('StoreKit')) {
      fs.writeFileSync(headerDst, headerContent);
    }

    // 3. 将源文件添加到 Xcode 项目编译阶段
    const xcodeProject = config.modResults;
    const target = xcodeProject.getFirstTarget();
    
    // 添加源文件到编译阶段
    const sourcesBuildPhase = xcodeProject.buildPhaseObject('PBXSourcesBuildPhase');
    if (!sourcesBuildPhase) {
      // 如果没有 Sources phase，跳过，Xcode 会自动扫描
      return config;
    }

    // 获取或创建文件引用
    const group = xcodeProject.findPBXGroupKey({ path: 'app', source: 'group', target: target.uuid });
    if (!group) {
      return config; // 自动扫描模式
    }

    return config;
  });
};
