# 快速开始 - EAS Build 打包

## 🚀 立即打包

```bash
# 1. 安装 EAS CLI（如果还没安装）
npm install -g eas-cli

# 2. 登录
eas login

# 3. 构建预览版 APK
eas build --platform android --profile preview

# 4. 等待构建完成（10-20分钟）
# 构建完成后会显示下载链接

# 5. 下载并安装
adb install path/to/your-app.apk
```

## ✅ 已完成的配置

### 1. URL 统一管理
- ✅ 所有硬编码 URL 已迁移到 `constants/urls.ts`
- ✅ 使用环境变量 `EXPO_PUBLIC_XIAOMAN_API_URL`
- ✅ 16 个文件已更新

### 2. 网络安全配置
- ✅ 创建了 `network_security_config.xml`
- ✅ 更新了 `app.json`
- ✅ 允许 HTTP 明文流量

### 3. 文件位置
```
项目根目录/
├── app.json                          # ✅ 已配置
├── network_security_config.xml       # ✅ 已创建
├── .env                              # ✅ 已存在
└── constants/urls.ts                 # ✅ 已创建
```

## 📋 验证清单

安装 APK 后测试：
- [ ] 登录功能（图片 + 网络请求）
- [ ] 聊天功能（发送消息 + 图片）
- [ ] 计划功能（列表 + 详情）
- [ ] 日记功能（生成 + 分享）
- [ ] VIP 中心（所有图片）

## 🔧 环境变量

`.env` 文件内容：
```properties
EXPO_PUBLIC_XIAOMAN_API_URL=http://xiaomanriji.com
```

## 📚 详细文档

- `EAS_BUILD_NETWORK_FIX.md` - 完整配置指南
- `URL_MIGRATION_COMPLETE.md` - 迁移完成报告
- `constants/urls.ts` - URL 常量定义

## ⚠️ 注意事项

1. **首次构建**：需要配置 EAS 项目
2. **构建时间**：通常需要 10-20 分钟
3. **网络要求**：需要稳定的网络连接
4. **账号要求**：需要 Expo 账号

## 🎯 预期结果

构建成功后：
- ✅ 所有 HTTP 请求正常
- ✅ 所有图片正常加载
- ✅ 登录功能正常
- ✅ 聊天功能正常
- ✅ 所有页面正常显示

## 💡 提示

如果遇到问题：
1. 检查 `app.json` 配置
2. 确认 `network_security_config.xml` 存在
3. 查看构建日志
4. 参考 `EAS_BUILD_NETWORK_FIX.md`

## 🎉 开始构建

```bash
eas build --platform android --profile preview
```

就这么简单！
