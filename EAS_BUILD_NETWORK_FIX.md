# EAS Build 网络安全配置指南

## 问题说明
APK 安装后出现 "Network request failed" 和图片无法加载，原因是 Android 9.0+ 默认禁止明文 HTTP 流量。

## 已完成的修复 ✅

### 1. 统一 URL 管理
所有硬编码的 `http://xiaomanriji.com` URL 已迁移到 `constants/urls.ts`，使用环境变量配置。

**已更新的文件（共 14 个）：**
- ✅ `components/chat/ChatHeader.tsx`
- ✅ `components/chat/ChatInput.tsx`
- ✅ `components/chat/MessageList.tsx`
- ✅ `components/chat/PlanList.tsx`
- ✅ `components/chat/PlanAddModal.tsx`
- ✅ `components/chat/DiaryGenerateModal.tsx`
- ✅ `components/diary/DiaryActionButtons.tsx`
- ✅ `components/plan/PlanItem.tsx`
- ✅ `components/plan/PlanEditModal.tsx`
- ✅ `app/login.tsx`
- ✅ `app/(tabs)/plan.tsx`
- ✅ `app/plan-manage.tsx`
- ✅ `app/plan-detail.tsx`
- ✅ `app/diary-share.tsx`
- ✅ `app/vip-center.tsx`
- ✅ `app/settings.tsx`

### 2. EAS Build 网络安全配置

#### 方案：通过 app.json 配置（推荐）

**文件结构：**
```
项目根目录/
├── app.json                          # Expo 配置文件
├── network_security_config.xml       # 网络安全配置文件（项目根目录）
└── .env                              # 环境变量
```

**配置说明：**

1. **app.json** 中添加了：
```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true,
      "networkSecurityConfig": "./network_security_config.xml"
    }
  }
}
```

2. **network_security_config.xml** 内容：
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">xiaomanriji.com</domain>
        <domain includeSubdomains="true">39.103.63.159</domain>
    </domain-config>
</network-security-config>
```

## EAS Build 打包步骤

### 1. 确保配置文件正确
```bash
# 检查文件是否存在
ls -la app.json
ls -la network_security_config.xml
ls -la .env
```

### 2. 使用 EAS Build 打包

#### 预览版（APK）
```bash
# 安装 EAS CLI（如果还没安装）
npm install -g eas-cli

# 登录 EAS
eas login

# 配置项目（首次）
eas build:configure

# 构建预览版 APK
eas build --platform android --profile preview
```

#### 生产版（AAB）
```bash
# 构建生产版
eas build --platform android --profile production
```

### 3. 下载并安装 APK
```bash
# EAS 构建完成后会提供下载链接
# 下载 APK 后安装到设备：
adb install path/to/your-app.apk
```

## eas.json 配置说明

当前配置：
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

**配置说明：**
- `preview` 配置用于生成 APK（可直接安装）
- `production` 配置用于生成 AAB（上传到 Google Play）
- `buildType: "apk"` 确保生成 APK 而不是 AAB

## 验证步骤

### 1. 检查网络配置是否生效
安装 APK 后，测试以下功能：

- ✅ 登录页面图片加载
- ✅ 发送验证码
- ✅ 登录成功
- ✅ 聊天页面图标显示
- ✅ 发送消息
- ✅ 接收回复
- ✅ 图片上传
- ✅ 计划页面图片
- ✅ 日记页面图片
- ✅ VIP 中心图片

### 2. 查看日志
```bash
# 连接设备后查看日志
adb logcat | grep -i "network\|cleartext\|http"
```

如果看到类似错误，说明配置未生效：
```
CLEARTEXT communication to xiaomanriji.com not permitted by network security policy
```

## 常见问题

### Q1: EAS Build 找不到 network_security_config.xml
**解决方案：**
- 确保文件在项目根目录
- 检查 app.json 中的路径是否正确：`"./network_security_config.xml"`
- 确保文件已提交到 git（如果使用 git）

### Q2: 构建成功但仍然无法加载图片
**排查步骤：**
1. 检查 .env 文件是否正确配置
2. 确认 `EXPO_PUBLIC_XIAOMAN_API_URL` 环境变量
3. 查看 APK 日志确认网络请求

### Q3: 本地构建 vs EAS Build 的区别
**本地构建：**
- 使用本地 Android SDK
- 需要手动配置 `android/app/src/main/res/xml/network_security_config.xml`
- 需要手动修改 `AndroidManifest.xml`

**EAS Build：**
- 使用云端构建环境
- 通过 `app.json` 自动配置
- 不需要本地 Android 环境

## 环境变量配置

### .env 文件
```properties
EXPO_PUBLIC_XIAOMAN_API_URL=http://xiaomanriji.com
```

### 在 EAS Build 中使用环境变量

#### 方法 1：使用 .env 文件（推荐）
EAS Build 会自动读取项目根目录的 `.env` 文件。

#### 方法 2：使用 EAS Secrets
```bash
# 设置环境变量
eas secret:create --scope project --name EXPO_PUBLIC_XIAOMAN_API_URL --value http://xiaomanriji.com

# 查看已设置的环境变量
eas secret:list
```

## 安全建议

### 1. 升级到 HTTPS（强烈推荐）
```
http://xiaomanriji.com → https://xiaomanriji.com
```

**优点：**
- 更安全，防止中间人攻击
- 不需要特殊网络配置
- 符合 Android 安全最佳实践
- 提升用户信任度

### 2. 限制明文流量域名
当前配置允许所有明文流量，建议只允许特定域名：

```xml
<network-security-config>
    <!-- 默认禁止明文流量 -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- 只允许特定域名 -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">xiaomanriji.com</domain>
    </domain-config>
</network-security-config>
```

### 3. 使用 CDN
将静态资源托管到支持 HTTPS 的 CDN，提升加载速度和安全性。

## 完整构建流程

```bash
# 1. 确保所有更改已提交
git add .
git commit -m "fix: 配置网络安全策略，允许 HTTP 流量"

# 2. 推送到远程仓库（如果使用 git）
git push

# 3. 使用 EAS Build 构建
eas build --platform android --profile preview

# 4. 等待构建完成（通常需要 10-20 分钟）
# 构建完成后会显示下载链接

# 5. 下载并安装 APK
# 方法 A：直接在手机上打开链接下载
# 方法 B：下载到电脑后通过 adb 安装
adb install path/to/your-app.apk

# 6. 测试所有功能
```

## 技术说明

### Android 网络安全配置的工作原理

1. **Android 9.0 (API 28) 开始**：
   - 默认禁止明文 HTTP 流量
   - 只允许 HTTPS 连接

2. **network_security_config.xml 的作用**：
   - 定义哪些域名可以使用 HTTP
   - 配置证书信任策略
   - 支持不同环境的不同配置

3. **EAS Build 如何应用配置**：
   - 读取 `app.json` 中的 `networkSecurityConfig` 路径
   - 将配置文件复制到 `android/app/src/main/res/xml/`
   - 在 `AndroidManifest.xml` 中添加引用

### 为什么需要两个配置？

1. **usesCleartextTraffic="true"**：
   - Android 9.0 的快速配置
   - 全局允许明文流量
   - 简单但不够精细

2. **networkSecurityConfig**：
   - 更细粒度的控制
   - 可以针对特定域名配置
   - 支持 Android 7.0+
   - 更安全的方案

## 参考资料

- [Expo Network Security Configuration](https://docs.expo.dev/guides/network-security-configuration/)
- [Android Network Security Config](https://developer.android.com/training/articles/security-config)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

## 总结

✅ **已完成：**
1. 所有硬编码 URL 已迁移到 `constants/urls.ts`
2. 创建了 `network_security_config.xml` 配置文件
3. 更新了 `app.json` 添加网络安全配置
4. 所有配置文件都在项目根目录，EAS Build 可以正确读取

🚀 **下一步：**
```bash
eas build --platform android --profile preview
```

构建完成后，下载并安装 APK，所有网络请求和图片加载应该都能正常工作！
