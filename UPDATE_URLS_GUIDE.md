# URL 更新指南

## 问题说明
APK 安装后出现 "Network request failed" 和图片无法加载的问题，原因：

1. **Android 9.0+ 默认禁止明文 HTTP 流量**
2. **硬编码的 URL** - 代码中直接使用 `http://xiaomanriji.com` 而不是环境变量

## 已完成的修复

### 1. Android 网络安全配置 ✅
- 创建了 `android/app/src/main/res/xml/network_security_config.xml`
- 更新了 `AndroidManifest.xml`，添加了：
  - `android:usesCleartextTraffic="true"`
  - `android:networkSecurityConfig="@xml/network_security_config"`

### 2. 创建统一的 URL 常量文件 ✅
- 创建了 `constants/urls.ts`
- 所有 URL 都从环境变量 `EXPO_PUBLIC_XIAOMAN_API_URL` 读取

### 3. 已更新的文件 ✅
- `components/chat/ChatHeader.tsx`
- `components/chat/ChatInput.tsx`
- `app/login.tsx`

## 需要手动更新的文件

以下文件仍需要更新，将硬编码的 URL 替换为从 `constants/urls.ts` 导入：

### 消息和聊天相关
- [ ] `components/chat/MessageList.tsx`
  ```typescript
  // 替换
  const RIGHT_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-icon-right.png';
  // 为
  import { RIGHT_ICON_URL } from '@/constants/urls';
  ```

- [ ] `components/chat/PlanList.tsx`
  ```typescript
  // 替换所有硬编码的 URL
  source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-icon-dot.png' }}
  // 为
  import { ICON_DOT_URL, RIGHT_ICON_URL } from '@/constants/urls';
  source={{ uri: ICON_DOT_URL }}
  ```

- [ ] `components/chat/PlanAddModal.tsx`
  ```typescript
  // 替换
  const FALLBACK_IMAGE_BASE_URL = 'http://xiaomanriji.com/api/files/plan';
  const ICON_RETURN_URL = 'http://xiaomanriji.com/api/files/xiaoman-icon-return.png';
  // 以及动态生成的 URL
  image: `http://xiaomanriji.com/api/files/${planTag}${randomNum}.jpg`
  // 为
  import { FALLBACK_IMAGE_BASE_URL, ICON_RETURN_URL, getPlanImageUrl, getPlanImagePreviewUrl } from '@/constants/urls';
  image: getPlanImageUrl(planTag, randomNum)
  ```

- [ ] `components/chat/DiaryGenerateModal.tsx`
  ```typescript
  import { RETURN_ICON_URL } from '@/constants/urls';
  ```

### 日记相关
- [ ] `components/diary/DiaryActionButtons.tsx`
  ```typescript
  import { EDIT_ICON_URL, EXPORT_ICON_URL } from '@/constants/urls';
  ```

- [ ] `app/diary-share.tsx`
  ```typescript
  import { QR_CODE_URL } from '@/constants/urls';
  ```

### 计划相关
- [ ] `components/plan/PlanItem.tsx`
  ```typescript
  import { FALLBACK_IMAGE_BASE_URL, PIN_IMAGE_URL, getFullImageUrl } from '@/constants/urls';
  // 替换
  return `http://xiaomanriji.com${plan.image}`;
  // 为
  return getFullImageUrl(plan.image);
  ```

- [ ] `components/plan/PlanEditModal.tsx`
  ```typescript
  import { FALLBACK_IMAGE_BASE_URL, getPlanImageUrl, getPlanImagePreviewUrl } from '@/constants/urls';
  ```

- [ ] `app/plan-manage.tsx`
  ```typescript
  import { FALLBACK_IMAGE_BASE_URL, PIN_IMAGE_URL, PIN_NORMAL_IMAGE_URL, getFullImageUrl } from '@/constants/urls';
  ```

- [ ] `app/plan-detail.tsx`
  ```typescript
  import { 
    FALLBACK_IMAGE_BASE_URL, 
    ICON_RETURN_URL, 
    OPTION_ICON_URL,
    MISSION_COMPLETED_ICON_URL,
    ICON_REPEAT_URL,
    ICON_CALC_URL,
    ICON_OK_URL,
    ICON_WARNING_URL
  } from '@/constants/urls';
  ```

### VIP 中心
- [ ] `app/vip-center.tsx`
  ```typescript
  import {
    VIP_HEADER_BG_URL,
    VIP_BANNER_URL,
    ICON_RETURN_DARK_URL,
    ICON_OPTION_DARK_URL,
    ICON_VIP_URL,
    VIP_SELECTED_URL,
    VIP_NORMAL_URL,
    VIP_NEW_FLAG_URL,
    VIP_RIGHT_ICON_URL,
    VIP_TEXT_GRADIENT_URL
  } from '@/constants/urls';
  ```

## 重新打包步骤

完成所有文件更新后：

```bash
# 1. 清理构建缓存
cd android
./gradlew clean

# 2. 重新打包
./gradlew assembleRelease

# 3. 安装到设备测试
adb install app/build/outputs/apk/release/app-1.0.0-release.apk
```

## 验证清单

- [ ] 所有硬编码的 URL 已替换为从 `constants/urls.ts` 导入
- [ ] Android 网络安全配置已添加
- [ ] 重新打包 APK
- [ ] 在真机上测试网络请求
- [ ] 验证所有图片能正常加载
- [ ] 测试登录功能
- [ ] 测试聊天功能
- [ ] 测试图片上传和显示

## 注意事项

1. **环境变量**：确保 `.env` 文件中的 `EXPO_PUBLIC_XIAOMAN_API_URL` 配置正确
2. **HTTPS 升级**：建议后续将服务器升级为 HTTPS，提高安全性
3. **缓存清理**：如果更新后仍有问题，尝试清理应用数据或重新安装
