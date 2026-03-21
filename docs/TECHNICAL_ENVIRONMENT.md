# 小满日记 - 技术环境说明

## 📋 目录
- [项目概述](#项目概述)
  - [开发目的](#开发目的)
  - [面向领域/行业](#面向领域行业)
  - [软件的主要功能](#软件的主要功能)
  - [软件的技术特点](#软件的技术特点)
- [开发硬件环境](#开发硬件环境)
- [运行硬件环境](#运行硬件环境)
- [开发操作系统](#开发操作系统)
- [软件开发环境/开发工具](#软件开发环境开发工具)
- [软件运行平台/操作系统](#软件运行平台操作系统)
- [软件运行支撑环境/支持软件](#软件运行支撑环境支持软件)
- [编程语言](#编程语言)

---

## 🎯 项目概述

### 开发目的

小满日记是一款基于人工智能技术的智能日记应用，旨在解决传统日记记录方式的痛点，为用户提供更加便捷、智能、有趣的日记记录体验。

#### 核心目标

1. **降低记录门槛**
   - 传统日记需要用户主动书写，门槛较高，容易放弃
   - 通过 AI 对话式交互，让记录变得像聊天一样简单自然
   - 支持语音输入、图片上传等多种记录方式

2. **提升记录质量**
   - AI 助手通过智能提问引导用户深入思考
   - 自动整理对话内容，生成结构化的日记
   - 提供情绪分析和记忆提取功能

3. **增强用户粘性**
   - 通过计划管理功能帮助用户养成良好习惯
   - 提供日记回顾和统计功能，增强成就感
   - 精美的 UI 设计和流畅的交互体验

4. **保护用户隐私**
   - 支持生物识别加密（Face ID/指纹）
   - 本地数据加密存储
   - 用户数据完全掌控

#### 解决的问题

- **记录困难**: 传统日记需要长时间书写，用户容易放弃
- **内容单薄**: 缺乏引导，记录内容往往流于表面
- **难以坚持**: 缺乏反馈和激励机制，难以养成习惯
- **隐私担忧**: 传统日记应用缺乏足够的隐私保护措施

---

### 面向领域/行业

#### 主要领域

**个人效能管理 (Personal Productivity)**
- 日记记录与回顾
- 习惯养成与追踪
- 目标管理与计划执行
- 情绪管理与心理健康

#### 目标用户群体

1. **年轻白领 (25-35岁)**
   - 工作压力大，需要情绪出口
   - 追求自我提升和个人成长
   - 熟悉移动应用，接受 AI 技术

2. **学生群体 (18-25岁)**
   - 记录学习生活和成长历程
   - 需要计划管理和习惯养成工具
   - 对新技术接受度高

3. **自我提升爱好者**
   - 注重个人成长和反思
   - 有长期记录习惯或想要养成记录习惯
   - 追求高质量的记录工具

4. **心理健康关注者**
   - 通过记录进行情绪管理
   - 需要隐私保护的倾诉渠道
   - 关注心理健康和自我认知

#### 应用场景

- **日常生活记录**: 记录生活点滴、心情感受
- **工作总结反思**: 记录工作经验、项目复盘
- **学习成长记录**: 记录学习心得、知识积累
- **情绪管理**: 倾诉压力、管理情绪
- **习惯养成**: 制定计划、追踪进度
- **目标管理**: 设定目标、记录达成过程

#### 行业定位

- **主赛道**: 个人效能管理工具
- **细分领域**: AI 驱动的智能日记应用
- **竞争优势**: 
  - AI 对话式交互降低记录门槛
  - 智能日记生成提升记录质量
  - 计划管理功能增强实用性
  - 隐私保护功能增强安全性

---

### 软件的主要功能

#### 1. 智能对话记录 💬

**核心功能**
- **AI 对话助手**: 通过自然语言对话记录日常生活
- **智能提问引导**: AI 主动提问，引导用户深入思考和表达
- **多模态输入**: 支持文字、语音、图片等多种输入方式
- **实时响应**: 流式输出，提供流畅的对话体验

**技术实现**
- 集成大语言模型 API
- 实时语音转文字
- 图片识别和理解
- 上下文记忆管理

**用户价值**
- 像聊天一样简单，降低记录门槛
- AI 引导让记录更深入、更有价值
- 多种输入方式适应不同场景

#### 2. 智能日记生成 📝

**核心功能**
- **一键生成日记**: 基于对话内容自动生成结构化日记
- **情绪分析**: 识别用户情绪状态，生成情绪标签
- **记忆提取**: 自动提取重要信息，构建用户记忆库
- **日记编辑**: 支持对生成的日记进行编辑和完善

**技术实现**
- AI 内容总结和提炼
- 情感分析算法
- 知识图谱构建
- Markdown 格式渲染

**用户价值**
- 节省整理时间，提高记录效率
- 结构化内容便于回顾和检索
- 情绪追踪帮助自我认知

#### 3. 计划管理 🎯

**核心功能**
- **计划创建**: 创建日常计划和习惯追踪
- **打卡记录**: 每日打卡，记录执行情况
- **进度追踪**: 可视化展示计划完成进度
- **图片记录**: 支持上传打卡图片作为证明
- **AI 生成封面**: 根据计划内容自动生成精美封面

**技术实现**
- 本地数据持久化
- 日期计算和周期管理
- 图片上传和存储
- AI 图片生成

**用户价值**
- 帮助养成良好习惯
- 可视化进度增强成就感
- 图片记录增加趣味性

#### 4. 日记回顾 📅

**核心功能**
- **日历视图**: 以日历形式展示日记记录
- **日记详情**: 查看完整的日记内容和图片
- **统计分析**: 展示记录天数、对话轮数等统计数据
- **日记分享**: 生成精美的日记分享图片

**技术实现**
- 日历组件开发
- 数据统计和可视化
- 截图和图片合成
- 社交分享功能

**用户价值**
- 回顾过往，感受成长
- 统计数据增强成就感
- 分享功能增加社交属性

#### 5. 隐私保护 🔐

**核心功能**
- **生物识别加密**: 支持 Face ID 和指纹识别
- **日记加密**: 可选择性加密敏感日记
- **本地存储**: 敏感数据本地加密存储
- **回收站**: 删除的日记可恢复

**技术实现**
- Expo Local Authentication
- Expo Secure Store
- 数据加密算法
- 软删除机制

**用户价值**
- 保护隐私，安心记录
- 防止误删，数据安全
- 多重保护，安全可靠

#### 6. 其他功能

**用户设置**
- 个人信息管理
- 应用偏好设置
- 账号安全设置

**反馈系统**
- 用户反馈提交
- 问题报告
- 功能建议

**VIP 会员**
- 会员权益展示
- 订阅管理
- 特权功能

---

### 软件的技术特点

#### 1. 跨平台架构 🌐

**技术方案**
- 基于 React Native 框架，一套代码同时支持 iOS 和 Android
- 使用 Expo 工具链，简化开发和部署流程
- 采用 Expo Router 实现文件系统路由

**技术优势**
- **开发效率高**: 一次开发，多端部署，节省 50% 以上开发时间
- **维护成本低**: 统一代码库，减少维护工作量
- **性能优秀**: 接近原生应用的性能表现
- **热更新支持**: 支持 OTA 更新，快速修复问题

**实现细节**
```typescript
// 使用 Platform API 处理平台差异
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? scaleSize(20) : 0,
  }
});
```

#### 2. AI 驱动的智能交互 🤖

**技术方案**
- 集成大语言模型 API（如 GPT-4）
- 实现流式响应，提供实时反馈
- 上下文管理，保持对话连贯性
- 多模态理解（文字、图片、语音）

**技术优势**
- **自然交互**: 像与朋友聊天一样自然
- **智能引导**: AI 主动提问，引导深入思考
- **个性化**: 基于用户历史记录提供个性化回复
- **多模态**: 支持文字、语音、图片等多种输入

**实现细节**
```typescript
// 流式响应实现
const handleStreamResponse = async (response: Response) => {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    // 实时更新 UI
    updateMessage(chunk);
  }
};
```

#### 3. 响应式 UI 设计 🎨

**技术方案**
- 使用 React Native Reanimated 实现流畅动画
- 采用 Gesture Handler 处理手势交互
- 自适应布局，支持不同屏幕尺寸
- 深色模式支持

**技术优势**
- **流畅动画**: 60fps 的动画性能
- **手势交互**: 丰富的手势操作
- **自适应**: 适配各种屏幕尺寸
- **美观**: 精心设计的 UI 界面

**实现细节**
```typescript
// 使用 Reanimated 实现动画
const cardSlideAnim = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: cardSlideAnim.value,
  transform: [{ translateY: cardSlideAnim.value * 100 }]
}));
```

#### 4. 模块化架构设计 🏗️

**技术方案**
- 组件化开发，提高代码复用性
- 自定义 Hooks 封装业务逻辑
- 服务层统一管理 API 调用
- Context API 管理全局状态

**技术优势**
- **可维护性**: 清晰的代码结构，易于维护
- **可扩展性**: 模块化设计，易于扩展新功能
- **可测试性**: 独立模块，便于单元测试
- **代码复用**: 组件和 Hooks 可在多处复用

**架构层次**
```
┌─────────────────────────────────┐
│      UI Layer (Components)      │  ← 展示层
├─────────────────────────────────┤
│    Business Logic (Hooks)       │  ← 业务逻辑层
├─────────────────────────────────┤
│     Service Layer (API)         │  ← 服务层
├─────────────────────────────────┤
│   Data Layer (Storage/Cache)    │  ← 数据层
└─────────────────────────────────┘
```

#### 5. 性能优化策略 ⚡

**技术方案**
- 图片懒加载和缓存
- 列表虚拟化（FlatList）
- 代码分割和按需加载
- Hermes 引擎优化 JavaScript 执行

**技术优势**
- **启动快**: 应用启动时间 < 2 秒
- **运行流畅**: 60fps 的滚动性能
- **内存优化**: 合理的内存使用
- **包体积小**: 优化后的应用体积

**优化措施**
```typescript
// 图片优化
<Image
  source={{ uri: imageUrl }}
  resizeMode="cover"
  style={styles.image}
  // 使用 Expo Image 组件自动缓存
/>

// 列表虚拟化
<FlatList
  data={messages}
  renderItem={renderMessage}
  keyExtractor={(item) => item.id}
  windowSize={10}  // 优化渲染窗口
  removeClippedSubviews={true}  // 移除屏幕外视图
/>
```

#### 6. 数据安全与隐私保护 🔒

**技术方案**
- 生物识别认证（Face ID/Touch ID/指纹）
- 本地数据加密存储（Secure Store）
- JWT Token 认证
- HTTPS 加密传输

**技术优势**
- **多重保护**: 生物识别 + 加密存储 + 安全传输
- **用户可控**: 用户完全掌控自己的数据
- **合规性**: 符合数据安全和隐私保护法规
- **透明性**: 明确的隐私政策和数据使用说明

**安全措施**
```typescript
// 生物识别认证
import * as LocalAuthentication from 'expo-local-authentication';

const authenticate = async () => {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: '验证身份以查看日记',
    fallbackLabel: '使用密码',
  });
  return result.success;
};

// 安全存储
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('token', userToken);
```

#### 7. 离线优先设计 📴

**技术方案**
- 本地数据缓存（AsyncStorage）
- 离线操作队列
- 网络状态检测
- 数据同步机制

**技术优势**
- **随时可用**: 无网络也能使用基本功能
- **数据安全**: 本地缓存防止数据丢失
- **用户体验**: 无缝的在线/离线切换
- **节省流量**: 减少不必要的网络请求

**实现策略**
```typescript
// 网络状态检测
import NetInfo from '@react-native-community/netinfo';

const [isConnected, setIsConnected] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsConnected(state.isConnected ?? false);
  });
  return unsubscribe;
}, []);
```

#### 8. 可扩展的插件架构 🔌

**技术方案**
- Expo 插件系统
- 原生模块扩展
- 自定义 Native Modules
- Config Plugins

**技术优势**
- **功能扩展**: 轻松添加新功能
- **第三方集成**: 方便集成第三方服务
- **原生能力**: 访问原生平台特性
- **灵活配置**: 通过配置文件管理插件

**插件示例**
```json
// app.json
{
  "plugins": [
    "expo-router",
    ["expo-local-authentication", {
      "faceIDPermission": "允许使用面容 ID"
    }],
    ["expo-splash-screen", {
      "image": "./assets/images/splash-icon.png"
    }]
  ]
}
```

#### 9. 持续集成与部署 🚀

**技术方案**
- EAS Build 云端构建
- EAS Submit 自动提交
- OTA 更新支持
- 版本管理和回滚

**技术优势**
- **自动化**: 自动构建和部署流程
- **快速迭代**: 快速发布新版本
- **热更新**: 无需重新下载即可更新
- **版本控制**: 完善的版本管理机制

**CI/CD 流程**
```bash
# 构建生产版本
eas build --platform ios --profile production

# 提交到 App Store
eas submit --platform ios --profile production

# OTA 更新
eas update --branch production
```

#### 10. 开发者友好 👨‍💻

**技术方案**
- TypeScript 类型安全
- ESLint 代码规范
- 完善的文档和注释
- 统一的代码风格

**技术优势**
- **类型安全**: 编译时发现错误
- **代码质量**: 统一的代码规范
- **易于维护**: 清晰的文档和注释
- **团队协作**: 统一的开发规范

**开发规范**
```typescript
// 类型定义
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

// 组件注释
/**
 * 聊天消息组件
 * @param message - 消息对象
 * @param onPress - 点击回调
 */
export function MessageItem({ message, onPress }: MessageItemProps) {
  // ...
}
```

---

## 🖥️ 开发硬件环境

### 最低配置要求
- **处理器**: Intel Core i5 或 Apple M1 及以上
- **内存**: 8GB RAM（推荐 16GB）
- **存储空间**: 至少 20GB 可用空间
- **显示器**: 1920x1080 分辨率

### 推荐配置
- **处理器**: Intel Core i7/i9 或 Apple M1 Pro/Max/Ultra
- **内存**: 16GB RAM 或更高
- **存储空间**: SSD 固态硬盘，50GB+ 可用空间
- **显示器**: 2K 或 4K 分辨率

### 外设要求
- **iOS 开发**: Mac 电脑（必需）
- **Android 开发**: 任意平台（Mac/Windows/Linux）
- **测试设备**: 
  - iOS 物理设备或模拟器
  - Android 物理设备或模拟器

---

## 📱 运行硬件环境

### iOS 设备要求
- **设备类型**: iPhone、iPad
- **处理器**: A9 芯片或更新（iPhone 6s 及以上）
- **内存**: 2GB RAM 或更高
- **存储空间**: 至少 100MB 可用空间
- **生物识别**: Face ID 或 Touch ID（可选，用于日记加密）

### Android 设备要求
- **设备类型**: 智能手机、平板电脑
- **处理器**: ARM 或 x86 架构
- **内存**: 2GB RAM 或更高（推荐 4GB+）
- **存储空间**: 至少 100MB 可用空间
- **生物识别**: 指纹识别或面部识别（可选，用于日记加密）

### 网络要求
- **网络连接**: 需要互联网连接（用于 AI 对话、图片上传等功能）
- **带宽**: 建议 3G 或更快的网络连接

---

## 💻 开发操作系统

### 支持的开发平台
| 操作系统 | 版本要求 | iOS 开发 | Android 开发 |
|---------|---------|---------|-------------|
| **macOS** | 12.0 (Monterey) 或更高 | ✅ 支持 | ✅ 支持 |
| **Windows** | Windows 10/11 (64-bit) | ❌ 不支持 | ✅ 支持 |
| **Linux** | Ubuntu 18.04+ 或其他主流发行版 | ❌ 不支持 | ✅ 支持 |

### 当前开发环境
- **操作系统**: macOS
- **平台**: darwin
- **Shell**: zsh

---

## 🛠️ 软件开发环境/开发工具

### 核心开发工具

#### 1. Node.js 环境
- **Node.js**: v18.0.0 或更高版本
- **npm**: v8.0.0 或更高版本
- **包管理器**: npm 或 yarn

#### 2. Expo CLI
- **版本**: ~54.0.33
- **用途**: React Native 开发框架和工具链
- **安装**: `npm install -g expo-cli`

#### 3. 代码编辑器
- **推荐**: Visual Studio Code
- **必需插件**:
  - ESLint
  - Prettier
  - React Native Tools
  - TypeScript and JavaScript Language Features

#### 4. 版本控制
- **Git**: 2.0 或更高版本
- **代码托管**: GitHub

#### 5. Android 开发工具（Android 开发必需）
- **Android Studio**: 最新稳定版
- **Android SDK**: API Level 24-36
  - **最低版本**: Android 7.0 (API 24)
  - **目标版本**: Android 14 (API 36)
- **Android SDK Build-Tools**: 最新版本
- **Android Emulator**: 用于测试
- **Java Development Kit (JDK)**: JDK 17 或更高

#### 6. iOS 开发工具（iOS 开发必需，仅 macOS）
- **Xcode**: 14.0 或更高版本
- **iOS SDK**: iOS 13.0 或更高
- **CocoaPods**: 1.11.0 或更高
- **Command Line Tools**: 通过 Xcode 安装

#### 7. 构建和部署工具
- **EAS CLI**: Expo Application Services
  - **版本**: >= 16.0.0
  - **用途**: 云端构建和发布
  - **安装**: `npm install -g eas-cli`

#### 8. 调试工具
- **React Native Debugger**: 独立调试工具
- **Flipper**: Facebook 的移动应用调试平台
- **Chrome DevTools**: 用于 Web 调试
- **Android Debug Bridge (adb)**: Android 设备调试

### 开发依赖包

```json
{
  "@react-native-community/cli": "latest",
  "@types/react": "~19.1.0",
  "eslint": "^9.25.0",
  "eslint-config-expo": "~10.0.0",
  "patch-package": "^8.0.0",
  "typescript": "~5.9.2"
}
```

---

## 📲 软件运行平台/操作系统

### iOS 平台
- **最低版本**: iOS 13.0
- **推荐版本**: iOS 15.0 或更高
- **支持设备**: 
  - iPhone 6s 及更新机型
  - iPad Air 2 及更新机型
  - iPad mini 4 及更新机型
  - iPod touch (第 7 代)

### Android 平台
- **最低版本**: Android 7.0 (API Level 24)
- **目标版本**: Android 14 (API Level 36)
- **推荐版本**: Android 10.0 或更高
- **支持架构**: 
  - ARM64 (arm64-v8a)
  - ARMv7 (armeabi-v7a)
  - x86_64
  - x86

### Web 平台（可选）
- **浏览器支持**:
  - Chrome 90+
  - Safari 14+
  - Firefox 88+
  - Edge 90+

---

## 🔧 软件运行支撑环境/支持软件

### 运行时环境

#### React Native 运行时
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Hermes Engine**: 启用（JavaScript 引擎）
- **JSC (JavaScriptCore)**: 备用引擎

#### 核心框架和库

##### 1. 导航和路由
- **expo-router**: ~6.0.23
- **@react-navigation/native**: ^7.1.8
- **@react-navigation/bottom-tabs**: ^7.4.0
- **react-native-screens**: ~4.16.0

##### 2. UI 和动画
- **react-native-reanimated**: ~4.1.1
- **react-native-gesture-handler**: ~2.28.0
- **expo-linear-gradient**: ^15.0.8
- **lottie-react-native**: ~7.3.1
- **@expo/vector-icons**: ^15.0.3

##### 3. 数据存储
- **@react-native-async-storage/async-storage**: ^2.2.0
- **expo-secure-store**: ^55.0.8

##### 4. 多媒体处理
- **expo-image**: ~3.0.11
- **expo-image-picker**: ~17.0.10
- **expo-image-manipulator**: ~14.0.8
- **expo-av**: ^16.0.8
- **expo-media-library**: ^18.2.1
- **react-native-view-shot**: ^4.0.3

##### 5. 设备功能
- **expo-local-authentication**: ~17.0.8（生物识别）
- **expo-location**: ~19.0.8（定位服务）
- **expo-haptics**: ~15.0.8（触觉反馈）
- **@react-native-community/netinfo**: ^12.0.1（网络状态）

##### 6. 网络和通信
- **axios**: ^1.13.6
- **urlcat**: ^3.1.0

##### 7. 内容渲染
- **react-native-markdown-display**: ^7.0.2
- **react-native-webview**: ^13.16.1

##### 8. 系统集成
- **expo-constants**: ~18.0.11
- **expo-file-system**: ^19.0.20
- **expo-linking**: ~8.0.11
- **expo-splash-screen**: ~31.0.13
- **expo-status-bar**: ~3.0.9
- **expo-system-ui**: ~6.0.9

### 后端服务依赖
- **API 服务器**: http://xiaomanriji.com
- **文件存储**: 云端文件服务
- **AI 服务**: 大语言模型 API
- **认证服务**: JWT Token 认证

### 第三方服务
- **Expo Application Services (EAS)**: 云端构建和发布
- **Apple App Store**: iOS 应用分发
- **Google Play Store**: Android 应用分发（计划中）

---

## 💬 编程语言

### 主要编程语言

#### 1. TypeScript
- **版本**: ~5.9.2
- **用途**: 主要开发语言
- **配置**: 严格模式启用
- **特性**:
  - 静态类型检查
  - 接口和类型定义
  - 泛型支持
  - 装饰器（实验性）

#### 2. JavaScript
- **标准**: ES2020+
- **用途**: 部分工具脚本和配置文件
- **特性**:
  - 异步/等待 (async/await)
  - 箭头函数
  - 解构赋值
  - 模板字符串
  - 可选链 (?.)
  - 空值合并 (??)

#### 3. JSX/TSX
- **用途**: React 组件开发
- **语法**: React 19.1.0 语法
- **特性**:
  - 组件化开发
  - Hooks API
  - Context API
  - React Compiler（实验性）

### 辅助语言

#### 4. Java/Kotlin
- **用途**: Android 原生模块开发
- **版本**: 
  - Java: JDK 17
  - Kotlin: 最新稳定版
- **使用场景**: 
  - Android 原生功能扩展
  - 第三方库集成
  - 性能优化

#### 5. Objective-C/Swift
- **用途**: iOS 原生模块开发
- **版本**: Swift 5.0+
- **使用场景**:
  - iOS 原生功能扩展
  - 第三方库集成
  - 性能优化

#### 6. Groovy
- **用途**: Android Gradle 构建脚本
- **文件**: build.gradle
- **使用场景**: 构建配置和依赖管理

#### 7. JSON
- **用途**: 配置文件和数据交换
- **文件类型**:
  - package.json
  - app.json
  - eas.json
  - tsconfig.json

#### 8. Markdown
- **用途**: 文档编写
- **文件**: README.md, 各类文档

---

## 📊 技术栈总览

### 前端技术栈
```
React Native 0.81.5
├── React 19.1.0
├── TypeScript 5.9.2
├── Expo SDK 54.0
├── Expo Router 6.0
└── React Native Reanimated 4.1
```

### 开发工具链
```
Node.js 18+
├── npm/yarn
├── Expo CLI
├── EAS CLI
├── TypeScript Compiler
└── ESLint
```

### 构建工具
```
Android
├── Gradle 8.x
├── Android SDK 24-36
└── Hermes Engine

iOS
├── Xcode 14+
├── CocoaPods
└── Hermes Engine
```

### 运行时架构
```
应用层 (TypeScript/React)
    ↓
React Native Bridge
    ↓
原生层 (Java/Kotlin/Swift/Objective-C)
    ↓
操作系统 (iOS/Android)
```

---

## 🔄 版本信息

| 组件 | 当前版本 | 最低要求 |
|------|---------|---------|
| 应用版本 | 1.0.1 | - |
| React Native | 0.81.5 | 0.81.0 |
| Expo SDK | ~54.0.33 | 54.0.0 |
| Node.js | 18+ | 18.0.0 |
| TypeScript | 5.9.2 | 5.0.0 |
| iOS | 13.0+ | 13.0 |
| Android | 7.0+ (API 24) | 7.0 (API 24) |

---

## 📝 开发环境配置步骤

### 1. 安装 Node.js
```bash
# macOS (使用 Homebrew)
brew install node

# 验证安装
node --version
npm --version
```

### 2. 安装 Expo CLI
```bash
npm install -g expo-cli
```

### 3. 安装 EAS CLI
```bash
npm install -g eas-cli
```

### 4. 克隆项目
```bash
git clone https://github.com/Kookaburra-maomao/xiaoman-app.git
cd xiaoman-app
```

### 5. 安装依赖
```bash
npm install
```

### 6. 配置 Android 环境（可选）
- 安装 Android Studio
- 配置 Android SDK
- 设置环境变量 ANDROID_HOME

### 7. 配置 iOS 环境（仅 macOS）
- 安装 Xcode
- 安装 CocoaPods: `sudo gem install cocoapods`
- 安装 iOS 依赖: `cd ios && pod install`

### 8. 启动开发服务器
```bash
npm start
```

---

## 🎯 构建和部署

### 开发构建
```bash
# Android
npm run android

# iOS
npm run ios
```

### 生产构建
```bash
# Android APK
npm run build:android:apk

# Android AAB
npm run build:android:prod

# iOS (TestFlight)
npm run build:ios:testflight
```

### 发布
```bash
# Android
npm run submit:android

# iOS
npm run submit:ios
```

---

## 📚 相关文档

- [README.md](../README.md) - 项目概述
- [BUILD_ANDROID.md](../BUILD_ANDROID.md) - Android 构建指南
- [AI_CONVENTIONS.md](../AI_CONVENTIONS.md) - AI 协作约定
- [DOCS_INDEX.md](../DOCS_INDEX.md) - 文档索引

---

**最后更新**: 2026-03-17
**维护者**: 小满日记开发团队
