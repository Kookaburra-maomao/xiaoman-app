# 快速参考 - 小满日记 APK 构建

## 🚀 一键构建

```bash
cd android && ./build-apk.sh
```

## 📦 APK 位置

```
android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

## 📲 快速安装

```bash
./install-test.sh
```

或手动：

```bash
adb install -r android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

## 🔧 常用命令

### 构建相关
```bash
# 清理构建
cd android && ./gradlew clean

# 构建 Release APK
cd android && ./gradlew assembleRelease

# 构建 Debug APK
cd android && ./gradlew assembleDebug

# 查看签名信息
cd android && ./gradlew signingReport
```

### 安装相关
```bash
# 安装到设备
adb install -r android/app/build/outputs/apk/release/app-1.0.0-release.apk

# 卸载应用
adb uninstall com.xiaomanriji.xiaomanapp

# 查看已安装版本
adb shell pm list packages | grep xiaomanriji

# 启动应用
adb shell am start -n com.xiaomanriji.xiaomanapp/.MainActivity
```

### 调试相关
```bash
# 查看日志
adb logcat | grep xiaomanriji

# 查看设备列表
adb devices

# 清除应用数据
adb shell pm clear com.xiaomanriji.xiaomanapp
```

## 📋 应用信息

| 项目 | 值 |
|------|-----|
| 应用名称 | xiaoman-app |
| 包名 | com.xiaomanriji.xiaomanapp |
| 版本 | 1.0.0 |
| 版本代码 | 1 |
| 最低 Android | 7.0 (API 24) |
| 目标 Android | 14 (API 36) |

## 🔐 签名信息

| 项目 | 值 |
|------|-----|
| Keystore | android/app/my-release-key.keystore |
| Alias | my-key-alias |
| 密码 | 521303 |
| 算法 | SHA256withRSA |

⚠️ **注意**：不要将密码提交到公开仓库！

## 📚 详细文档

- **[BUILD_APK.md](BUILD_APK.md)** - 完整构建指南
- **[INSTALL_APK.md](INSTALL_APK.md)** - 安装说明和故障排除
- **[APK_BUILD_SUMMARY.md](APK_BUILD_SUMMARY.md)** - 构建总结
- **[SECURITY_NOTES.md](SECURITY_NOTES.md)** - 安全注意事项

## ⚡ 快速故障排除

### 构建失败
```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### 安装失败：签名冲突
```bash
adb uninstall com.xiaomanriji.xiaomanapp
adb install android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

### 设备未连接
```bash
# 检查设备
adb devices

# 重启 ADB
adb kill-server
adb start-server
```

## 🎯 版本更新流程

1. 更新版本号：
   - `android/app/build.gradle` → `versionCode` 和 `versionName`
   - `app.json` → `version` 和 `android.versionCode`

2. 构建新版本：
   ```bash
   cd android && ./build-apk.sh
   ```

3. 测试安装：
   ```bash
   ./install-test.sh
   ```

4. 发布分发

## 💡 提示

- 首次构建可能需要 5-10 分钟下载依赖
- 后续构建通常只需 1-2 分钟
- 使用 `--offline` 参数可以离线构建（需要先下载依赖）
- Release APK 已启用代码混淆和资源压缩
- 新架构（New Architecture）已启用
