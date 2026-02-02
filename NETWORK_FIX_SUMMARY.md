# 网络请求失败问题修复总结

## 问题描述
APK 安装到 Android 设备后出现：
- ❌ Network request failed
- ❌ 所有图片无法加载（http://xiaomanriji.com/api/files/...）

## 根本原因
**Android 9.0 (API 28) 及以上版本默认禁止明文 HTTP 流量**

从 Android 9.0 开始，系统默认只允许 HTTPS 连接，HTTP 请求会被阻止。

## 已完成的修复 ✅

### 1. 添加网络安全配置
创建了 `android/app/src/main/res/xml/network_security_config.xml`：
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- 允许所有明文 HTTP 流量 -->
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- 特别允许 xiaomanriji.com 域名的明文流量 -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">xiaomanriji.com</domain>
        <domain includeSubdomains="true">39.103.63.159</domain>
    </domain-config>
</network-security-config>
```

### 2. 更新 AndroidManifest.xml
在 `<application>` 标签中添加：
```xml
android:usesCleartextTraffic="true"
android:networkSecurityConfig="@xml/network_security_config"
```

### 3. 创建统一的 URL 管理
创建了 `constants/urls.ts` 文件，统一管理所有 URL，使用环境变量配置。

### 4. 更新部分组件
已更新以下组件使用新的 URL 常量：
- ✅ `components/chat/ChatHeader.tsx`
- ✅ `components/chat/ChatInput.tsx`
- ✅ `app/login.tsx`

## 待完成的工作 ⏳

### 需要更新的文件（共 14 个）
以下文件仍使用硬编码的 URL，需要更新为从 `constants/urls.ts` 导入：

1. `components/chat/MessageList.tsx`
2. `components/chat/PlanList.tsx`
3. `components/chat/PlanAddModal.tsx`
4. `components/chat/DiaryGenerateModal.tsx`
5. `components/diary/DiaryActionButtons.tsx`
6. `components/plan/PlanItem.tsx`
7. `components/plan/PlanEditModal.tsx`
8. `app/(tabs)/plan.tsx`
9. `app/plan-manage.tsx`
10. `app/plan-detail.tsx`
11. `app/diary-share.tsx`
12. `app/vip-center.tsx`
13. `app/settings.tsx`

## 立即测试方案

### 方案 A：重新打包测试网络配置（推荐）
```bash
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-1.0.0-release.apk
```

**预期结果**：
- ✅ 网络请求应该能正常工作
- ✅ 已更新的组件（登录页、聊天头部、聊天输入）的图片应该能加载
- ⚠️ 其他未更新的组件图片可能仍无法加载（因为还是硬编码 URL）

### 方案 B：完整修复后再打包
1. 更新所有 14 个文件，替换硬编码 URL
2. 重新打包
3. 测试所有功能

## 快速验证步骤

安装新 APK 后，按以下顺序测试：

1. **登录页面** ✅
   - Logo 图片能否显示
   - Slogan 图片能否显示
   - 能否发送验证码
   - 能否登录

2. **聊天页面** ✅
   - 头部图标能否显示
   - 输入框图标能否显示
   - 能否发送消息
   - 能否接收回复

3. **其他页面** ⚠️
   - 计划页面图片
   - 日记页面图片
   - VIP 中心图片

## 长期建议

### 1. 升级到 HTTPS（强烈推荐）
```
http://xiaomanriji.com → https://xiaomanriji.com
```

**优点**：
- 更安全
- 不需要特殊配置
- 符合 Android 安全最佳实践
- 避免中间人攻击

### 2. 使用 CDN
将静态资源（图片）托管到 CDN，提升加载速度。

### 3. 图片优化
- 使用 WebP 格式
- 提供不同尺寸的图片
- 实现图片懒加载

## 技术说明

### 为什么 Android 9.0+ 禁止 HTTP？
- **安全性**：HTTP 是明文传输，容易被窃听和篡改
- **隐私保护**：防止用户数据泄露
- **行业趋势**：Google 推动全网 HTTPS 化

### 网络安全配置的作用
- `cleartextTrafficPermitted="true"`：允许明文 HTTP 流量
- `domain-config`：针对特定域名的配置
- `base-config`：全局默认配置

### 为什么需要两个配置？
1. `android:usesCleartextTraffic="true"`：Android 9.0 的快速配置
2. `android:networkSecurityConfig`：更细粒度的控制，支持 Android 7.0+

## 下一步行动

### 立即执行（解决当前问题）
```bash
# 重新打包并测试
cd android
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-1.0.0-release.apk
```

### 后续优化（提升代码质量）
1. 批量更新所有文件使用 `constants/urls.ts`
2. 测试所有页面功能
3. 考虑升级到 HTTPS

## 参考资料
- [Android Network Security Configuration](https://developer.android.com/training/articles/security-config)
- [Opt out of cleartext traffic](https://developer.android.com/guide/topics/manifest/application-element#usesCleartextTraffic)
