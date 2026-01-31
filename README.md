# 小满日记 (Xiaoman Diary) 📱

一个基于 React Native + Expo 开发的智能日记应用。

## ✨ 功能特性

- 📝 智能对话式日记记录
- 🎯 计划管理和提醒
- 🔐 生物识别加密保护
- 📸 图片和多媒体支持
- 🎨 精美的 UI 设计
- 🌙 深色模式支持

## 🚀 快速开始

### 开发环境

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动开发服务器

   ```bash
   npx expo start
   ```

3. 运行应用
   - Android 模拟器：按 `a`
   - iOS 模拟器：按 `i`
   - 物理设备：扫描二维码

### 构建 APK

快速构建测试版 APK：

```bash
cd android && ./build-apk.sh
```

详细说明请查看 [APK 构建指南](BUILD_APK.md)

## 📦 APK 安装

### 快速安装到设备

```bash
./install-test.sh
```

### 手动安装

```bash
adb install -r android/app/build/outputs/apk/release/app-1.0.0-release.apk
```

详细说明请查看 [APK 安装指南](INSTALL_APK.md)

## 📚 文档

- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 快速参考和常用命令
- **[BUILD_APK.md](BUILD_APK.md)** - 完整的 APK 构建指南
- **[INSTALL_APK.md](INSTALL_APK.md)** - APK 安装方法和故障排除
- **[APK_BUILD_SUMMARY.md](APK_BUILD_SUMMARY.md)** - 构建配置总结
- **[SECURITY_NOTES.md](SECURITY_NOTES.md)** - 安全注意事项
- **[BUILD_ANDROID.md](BUILD_ANDROID.md)** - Android 原生构建说明

## 🛠️ 技术栈

- **框架**: React Native 0.81.5
- **开发工具**: Expo SDK ~54.0
- **路由**: Expo Router
- **UI**: React Native Reanimated, Gesture Handler
- **状态管理**: React Context
- **存储**: AsyncStorage
- **认证**: Expo Local Authentication

## 📱 应用信息

| 项目 | 值 |
|------|-----|
| 应用名称 | xiaoman-app |
| 包名 | com.xiaomanriji.xiaomanapp |
| 当前版本 | 1.0.0 |
| 最低 Android | 7.0 (API 24) |
| 目标 Android | 14 (API 36) |

## 🔧 项目结构

```
xiaoman-app/
├── app/                    # 应用页面（Expo Router）
│   ├── (tabs)/            # 底部导航页面
│   ├── _layout.tsx        # 根布局
│   └── ...                # 其他页面
├── components/            # 可复用组件
├── hooks/                 # 自定义 Hooks
├── services/              # API 服务
├── utils/                 # 工具函数
├── constants/             # 常量配置
├── types/                 # TypeScript 类型
├── android/               # Android 原生代码
└── ios/                   # iOS 原生代码
```

## 🎯 开发命令

```bash
# 启动开发服务器
npm start

# 运行 Android
npm run android

# 运行 iOS
npm run ios

# 代码检查
npm run lint

# 构建 APK
cd android && ./build-apk.sh
```

## 🔐 安全注意事项

⚠️ **重要**：不要将以下文件提交到公开仓库：
- `android/app/my-release-key.keystore`
- `android/gradle.properties`（包含密码）

详细安全建议请查看 [SECURITY_NOTES.md](SECURITY_NOTES.md)

## 📄 许可证

私有项目

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
