# 小满日记 APK 打包指南

## 📋 配置信息

- **应用 ID**: `com.xiaomanriji.xiaomanapp`
- **版本号**: 1.0.0
- **版本代码**: 1
- **Keystore**: `android/app/my-release-key.keystore`
- **Key Alias**: `my-key-alias`
- **新架构**: 已启用（New Architecture Enabled）
- **Hermes 引擎**: 已启用

## 🚀 快速打包

### 方法一：使用脚本（推荐）

```bash
cd android
./build-apk.sh
```

### 方法二：手动构建

```bash
cd android

# 清理构建
./gradlew clean

# 构建 Release APK
./gradlew assembleRelease

# 构建 Debug APK（用于测试）
./gradlew assembleDebug
```

## 📦 输出文件位置

构建完成后，APK 文件会生成在：

- **Release APK**: `android/app/build/outputs/apk/release/app-1.0.0-release.apk`
- **Debug APK**: `android/app/build/outputs/apk/debug/app-1.0.0-debug.apk`

## 🔧 构建类型说明

### Release（发布版）
- 已签名，可直接安装
- 代码已混淆和优化
- 体积更小，性能更好
- 适合发布到应用商店或分发给用户

### Debug（调试版）
- 使用 debug keystore 签名
- 未混淆，便于调试
- 体积较大
- 仅用于开发测试

## 📱 安装 APK

### 通过 ADB 安装
```bash
adb install android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

### 手动安装
1. 将 APK 文件传输到 Android 设备
2. 在设备上打开文件管理器
3. 点击 APK 文件进行安装
4. 如果提示"未知来源"，需要在设置中允许安装

## 🔍 验证签名

查看 APK 签名信息：

```bash
# 查看 keystore 信息
keytool -list -v -keystore android/app/my-release-key.keystore -alias my-key-alias

# 查看 APK 签名
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

## ⚠️ 注意事项

1. **密钥安全**：
   - 不要将 `gradle.properties` 中的密码提交到 Git
   - 建议使用环境变量或 CI/CD 密钥管理

2. **版本管理**：
   - 每次发布新版本时，需要更新 `versionCode` 和 `versionName`
   - 在 `android/app/build.gradle` 中修改

3. **首次构建**：
   - 首次构建可能需要下载依赖，耗时较长
   - 确保网络连接正常

## 🐛 常见问题

### 构建失败
```bash
# 清理并重新构建
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### 签名错误
检查 `android/gradle.properties` 中的签名配置是否正确。

### 内存不足
如果构建时出现内存错误，可以增加 Gradle 内存：
```properties
# 在 android/gradle.properties 中
org.gradle.jvmargs=-Xmx4096m
```

## 📚 相关命令

```bash
# 查看所有可用的构建任务
cd android && ./gradlew tasks

# 构建并安装到连接的设备
./gradlew installRelease

# 查看构建信息
./gradlew assembleRelease --info

# 生成签名报告
./gradlew signingReport
```
