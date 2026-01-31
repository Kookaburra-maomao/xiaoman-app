#!/usr/bin/env node
/**
 * Postinstall: 注释掉 Reanimated / Worklets 的 New Architecture 断言，以支持本地 Android 构建（关闭新架构时）
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// 1. Patch react-native-reanimated
const reanimatedPath = path.join(root, 'node_modules/react-native-reanimated/android/build.gradle');
if (fs.existsSync(reanimatedPath)) {
  let content = fs.readFileSync(reanimatedPath, 'utf8');
  const reanimatedBlock = `task assertNewArchitectureEnabledTask {
    onlyIf { !IS_NEW_ARCHITECTURE_ENABLED }
    doFirst {
        throw new GradleException("[Reanimated] Reanimated requires new architecture to be enabled. Please enable it by setting \`newArchEnabled\` to \`true\` in \`gradle.properties\`.")
    }
}

preBuild.dependsOn(assertNewArchitectureEnabledTask)`;
  const reanimatedCommented = `// [PATCH] Allow building without New Architecture for local Android (Fabric linker issues)
// task assertNewArchitectureEnabledTask {
//     onlyIf { !IS_NEW_ARCHITECTURE_ENABLED }
//     doFirst {
//         throw new GradleException("[Reanimated] Reanimated requires new architecture to be enabled. Please enable it by setting \`newArchEnabled\` to \`true\` in \`gradle.properties\`.")
//     }
// }
// preBuild.dependsOn(assertNewArchitectureEnabledTask)`;
  if (content.includes('[Reanimated] Reanimated requires new architecture') && !content.includes('// [PATCH] Allow building without New Architecture')) {
    content = content.replace(reanimatedBlock, reanimatedCommented);
    fs.writeFileSync(reanimatedPath, content);
    console.log('patch-reanimated: Applied Reanimated New Arch assert patch.');
  }
}

// 2. Patch react-native-worklets
const workletsPath = path.join(root, 'node_modules/react-native-worklets/android/build.gradle');
if (fs.existsSync(workletsPath)) {
  let content = fs.readFileSync(workletsPath, 'utf8');
  const workletsBlock = `task assertNewArchitectureEnabledTask {
    onlyIf { !IS_NEW_ARCHITECTURE_ENABLED }
    doFirst {
        throw new GradleException("[Worklets] Worklets require new architecture to be enabled. Please enable it by setting \`newArchEnabled\` to \`true\` in \`gradle.properties\`.")
    }
}

preBuild.dependsOn(assertNewArchitectureEnabledTask)`;
  const workletsCommented = `// [PATCH] Allow building without New Architecture for local Android (Fabric linker issues)
// task assertNewArchitectureEnabledTask {
//     onlyIf { !IS_NEW_ARCHITECTURE_ENABLED }
//     doFirst {
//         throw new GradleException("[Worklets] Worklets require new architecture to be enabled. Please enable it by setting \`newArchEnabled\` to \`true\` in \`gradle.properties\`.")
//     }
// }
// preBuild.dependsOn(assertNewArchitectureEnabledTask)`;
  if (content.includes('[Worklets] Worklets require new architecture') && !content.includes('// [PATCH] Allow building without New Architecture')) {
    content = content.replace(workletsBlock, workletsCommented);
    fs.writeFileSync(workletsPath, content);
    console.log('patch-reanimated: Applied Worklets New Arch assert patch.');
  }
}
