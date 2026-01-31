# Android 构建说明

为规避 RN 0.81 新架构下 `libreactnative.so` 未导出 Fabric 符号（Sealable、DebugStringConvertible 等）导致的本地链接错误，**本项目 Android 已关闭 New Architecture**（`newArchEnabled=false`）。Reanimated/Worklets 的“必须新架构”断言已通过 `scripts/patch-reanimated.js` 在 postinstall 时屏蔽，以便本地 Gradle 能通过。

## 本地构建（推荐步骤）

**不要执行 `./gradlew clean`**（会因 codegen 目录未生成而报错）。请用下面两种方式之一。

### 方式一：使用脚本

```bash
cd android
./clean-and-build.sh
```

脚本会删除 `app/.cxx`、`app/build`、`build` 后执行 `./gradlew assembleDebug`。

### 方式二：手动命令

```bash
cd android
rm -rf app/.cxx app/build build
./gradlew assembleDebug
```

## 环境要求

- 已安装 JDK 17（或项目要求的版本）并配置好 `JAVA_HOME`
- 已安装 Android SDK 并配置好 `ANDROID_HOME`
- 项目根目录已执行 `npm install`（会自动执行 patch-package 与 patch-reanimated.js）

## 若仍需新架构或 EAS 构建

- **新架构**：若改回 `newArchEnabled=true`（app.json 与 android/gradle.properties），本地 Android 构建会再次出现 Fabric 符号未定义错误，此时请用 **EAS Build** 打 Android 包。
- **EAS Build**：`eas build --platform android --profile preview`（或 `--profile production`）。
