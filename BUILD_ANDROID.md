# Android 线上包构建指南

## 前置要求

1. **安装 EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **登录 Expo 账号**
   ```bash
   eas login
   ```

3. **配置项目**
   ```bash
   eas build:configure
   ```

## 构建命令

### 1. 生产环境 AAB 包（推荐）
用于上传到 Google Play Store：
```bash
eas build --platform android --profile production
```

特点：
- ✅ 自动版本号递增（autoIncrement: true）
- ✅ 生成 AAB 格式（Android App Bundle）
- ✅ 优化包体积
- ✅ 支持动态交付

### 2. 生产环境 APK 包
用于直接分发给用户（不通过应用商店）：
```bash
eas build --platform android --profile production --build-type apk
```

### 3. 预览 APK 包
用于内部测试：
```bash
eas build --platform android --profile preview
```

特点：
- 生成 APK 格式
- 内部分发（internal distribution）
- 适合测试环境

## 构建选项

### 指定版本号
```bash
eas build --platform android --profile production --auto-submit
```

### 本地构建（需要配置本地环境）
```bash
eas build --platform android --profile production --local
```

### 清除缓存重新构建
```bash
eas build --platform android --profile production --clear-cache
```

## 构建后操作

### 1. 下载构建产物
构建完成后，可以从 Expo 网站下载：
```bash
# 在浏览器中打开
https://expo.dev/accounts/[your-account]/projects/xiaoman/builds
```

或使用命令行下载：
```bash
eas build:list
eas build:download [build-id]
```

### 2. 提交到 Google Play
```bash
eas submit --platform android --profile production
```

## 常见问题

### 1. 构建失败：缺少签名密钥
EAS 会自动为你生成签名密钥。如果需要使用自己的密钥：

```bash
# 生成密钥
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 在 eas.json 中配置
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### 2. 构建时间过长
- 使用 `--clear-cache` 清除缓存
- 检查依赖是否过多
- 考虑使用本地构建

### 3. 包体积过大
- 使用 AAB 格式（自动优化）
- 移除未使用的依赖
- 启用代码压缩和混淆

## 版本管理

当前配置会自动递增版本号（`autoIncrement: true`）。

如果需要手动指定版本：

**app.json / app.config.js**
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

## 快速构建脚本

你可以在 package.json 中添加快速命令：

```json
{
  "scripts": {
    "build:android:prod": "eas build --platform android --profile production",
    "build:android:apk": "eas build --platform android --profile production --build-type apk",
    "build:android:preview": "eas build --platform android --profile preview",
    "submit:android": "eas submit --platform android --profile production"
  }
}
```

然后使用：
```bash
npm run build:android:prod
npm run build:android:apk
npm run build:android:preview
npm run submit:android
```

## 构建状态查看

### 查看构建列表
```bash
eas build:list
```

### 查看特定构建详情
```bash
eas build:view [build-id]
```

### 取消构建
```bash
eas build:cancel [build-id]
```

## 推荐工作流

### 开发阶段
```bash
# 1. 本地开发测试
npm start

# 2. 构建预览版测试
npm run build:android:preview

# 3. 分发给测试人员
```

### 发布阶段
```bash
# 1. 构建生产版本
npm run build:android:prod

# 2. 下载并测试
eas build:download [build-id]

# 3. 提交到 Google Play
npm run submit:android
```

## 注意事项

1. ✅ 确保 `.env` 文件中的环境变量正确
2. ✅ 检查 `app.json` 中的应用信息（名称、包名、图标等）
3. ✅ 测试所有功能在生产环境下正常工作
4. ✅ 准备好应用商店的截图和描述
5. ✅ 确保遵守 Google Play 政策

## 相关链接

- [EAS Build 文档](https://docs.expo.dev/build/introduction/)
- [EAS Submit 文档](https://docs.expo.dev/submit/introduction/)
- [Android 应用签名](https://docs.expo.dev/app-signing/app-credentials/)
