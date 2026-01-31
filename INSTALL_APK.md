# 小满日记 APK 安装指南

## 📱 APK 文件位置

构建成功后，APK 文件位于：
```
android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

文件大小：约 76 MB

## 🔐 签名信息

- **所有者**: CN=Kookaburra, OU=xiaomanriji, O=xiaomanriji, L=shanghai, ST=shanghai, C=CN
- **Key Alias**: my-key-alias
- **有效期**: 2026年1月31日 - 2053年6月18日
- **签名算法**: SHA256withRSA

## 📲 安装方法

### 方法一：通过 ADB 安装（推荐）

1. 确保手机已连接到电脑并开启 USB 调试
2. 运行以下命令：

```bash
adb install android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

如果已安装旧版本，使用 `-r` 参数覆盖安装：
```bash
adb install -r android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

### 方法二：手动安装

1. 将 APK 文件传输到 Android 设备（通过 USB、云盘、邮件等）
2. 在设备上找到 APK 文件
3. 点击 APK 文件开始安装
4. 如果提示"未知来源"警告：
   - 进入 **设置 > 安全 > 未知来源**
   - 或 **设置 > 应用和通知 > 特殊应用权限 > 安装未知应用**
   - 允许从该来源安装应用

### 方法三：通过文件管理器

1. 使用文件管理器（如 ES文件浏览器、小米文件管理等）
2. 找到 APK 文件
3. 点击安装

## ✅ 验证安装

安装完成后：
1. 在应用列表中找到"xiaoman-app"
2. 点击图标启动应用
3. 检查应用版本：设置 > 关于 > 版本 1.0.0

## 🔍 查看已安装应用信息

```bash
# 查看应用是否已安装
adb shell pm list packages | grep xiaomanriji

# 查看应用详细信息
adb shell dumpsys package com.xiaomanriji.xiaomanapp | grep version
```

## 🗑️ 卸载应用

```bash
# 通过 ADB 卸载
adb uninstall com.xiaomanriji.xiaomanapp

# 或在手机上长按应用图标 > 卸载
```

## ⚠️ 常见问题

### 安装失败：签名冲突
如果之前安装过不同签名的版本，需要先卸载：
```bash
adb uninstall com.xiaomanriji.xiaomanapp
adb install android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

### 安装失败：空间不足
- 清理手机存储空间
- APK 大小约 76 MB，建议至少保留 200 MB 可用空间

### 无法安装：未知来源
- Android 8.0+ 需要为每个应用单独授权安装权限
- 在安装时会弹出提示，点击"设置"并允许

### 应用闪退
- 检查 Android 版本是否 >= 7.0（API 24）
- 查看日志：`adb logcat | grep xiaomanriji`

## 📝 版本信息

- **应用名称**: xiaoman-app
- **包名**: com.xiaomanriji.xiaomanapp
- **版本号**: 1.0.0
- **版本代码**: 1
- **最低 Android 版本**: 7.0 (API 24)
- **目标 Android 版本**: 14 (API 36)

## 🚀 分发建议

### 内部测试
- 直接通过 ADB 安装
- 或使用蒲公英、fir.im 等内测分发平台

### 正式发布
- 上传到 Google Play Store
- 或国内应用商店（华为、小米、OPPO、vivo 等）
- 需要准备应用截图、描述、隐私政策等材料
