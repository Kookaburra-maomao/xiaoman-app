# JWT 自动续期实现指南

## 📋 概述

本项目已实现完整的 JWT 自动续期功能，包括：

- ✅ 自动在请求头添加 `Authorization: Bearer {token}`
- ✅ 自动检测响应头 `X-New-Token` 并更新本地存储
- ✅ 处理 401 错误，清除 token 并跳转登录页
- ✅ App 启动时自动检查 token 并获取用户信息
- ✅ App 从后台切换到前台时自动刷新
- ✅ 网络从断开到连接时自动刷新
- ✅ 定期心跳机制（每 30 分钟）

## 📦 安装依赖

```bash
npm install axios expo-secure-store @react-native-community/netinfo
```

或

```bash
yarn add axios expo-secure-store @react-native-community/netinfo
```

## 📁 文件结构

```
utils/
├── jwtRequest.ts          # JWT 请求工具（axios 拦截器）
└── jwtAuth.ts             # JWT 认证工具函数

contexts/
└── JwtAuthContext.tsx     # JWT 认证上下文（全局状态管理）

app/
└── jwt-login-example.tsx  # JWT 登录页面示例
```

## 🚀 快速开始

### 1. 在 App 根组件中使用 JwtAuthProvider

修改 `app/_layout.tsx`：

```tsx
import { JwtAuthProvider, useJwtAuth } from '@/contexts/JwtAuthContext';

function RootLayoutContent() {
  const { isAuthenticated, loading } = useJwtAuth();
  // ... 路由守卫逻辑
}

export default function RootLayout() {
  return (
    <JwtAuthProvider>
      <RootLayoutContent />
    </JwtAuthProvider>
  );
}
```

### 2. 在登录页面使用 JWT 登录

参考 `app/jwt-login-example.tsx`：

```tsx
import { useJwtAuth } from '@/contexts/JwtAuthContext';

export default function LoginScreen() {
  const { login } = useJwtAuth();

  const handleLogin = async () => {
    try {
      await login(phone, verifyCode);
      router.replace('/(tabs)/chat');
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };
}
```

### 3. 在其他页面使用 JWT 请求

```tsx
import { jwtGet, jwtPost, jwtPut, jwtDel } from '@/utils/jwtRequest';

// GET 请求
const data = await jwtGet('/api/some-endpoint');

// POST 请求
const result = await jwtPost('/api/some-endpoint', { key: 'value' });

// PUT 请求
const updated = await jwtPut('/api/some-endpoint', { key: 'value' });

// DELETE 请求
const deleted = await jwtDel('/api/some-endpoint');
```

### 4. 在组件中使用认证状态

```tsx
import { useJwtAuth } from '@/contexts/JwtAuthContext';

export default function SomeScreen() {
  const { user, isAuthenticated, logout, refreshAuth } = useJwtAuth();

  if (!isAuthenticated) {
    return <Text>请先登录</Text>;
  }

  return (
    <View>
      <Text>欢迎，{user?.nick || user?.username}</Text>
      <Button title="刷新" onPress={refreshAuth} />
      <Button title="登出" onPress={logout} />
    </View>
  );
}
```

## 🔧 核心功能说明

### 1. 自动续期机制

每次调用需要认证的接口时：
- 请求拦截器自动添加 `Authorization: Bearer {token}`
- 响应拦截器检测 `X-New-Token` 响应头
- 如果存在新 token，自动更新本地存储

### 2. 401 错误处理

当收到 401 错误时：
- 自动清除本地 token 和用户信息
- 触发 `onUnauthorizedCallback` 回调
- AuthContext 更新状态，触发路由守卫跳转到登录页

### 3. App 生命周期监听

- 使用 `AppState` 监听 App 状态变化
- 从后台切换到前台时，自动调用 `/api/auth-jwt/me` 刷新用户信息
- 触发自动续期，确保 token 持续有效

### 4. 网络状态监听

- 使用 `@react-native-community/netinfo` 监听网络状态
- 网络从断开到连接时，自动刷新用户信息
- 确保网络恢复后 token 及时更新

### 5. 定期心跳机制

- 每 30 分钟自动调用 `/api/auth-jwt/me`
- 确保长时间使用 App 的用户 token 持续有效
- 只在用户登录状态下启用

## 📝 API 接口说明

### 登录接口

```
POST /api/auth-jwt/login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "1234"
}

Response:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "user123",
      "phone": "13800138000",
      ...
    }
  }
}
```

### 获取用户信息接口

```
GET /api/auth-jwt/me
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": "1",
    "username": "user123",
    ...
  }
}

Response Headers:
X-New-Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 手动刷新接口

```
POST /api/auth-jwt/refresh
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🧪 测试场景

### 1. 登录后立即调用接口

- ✅ 验证 token 自动添加到请求头
- ✅ 验证响应头返回新 token
- ✅ 验证本地存储自动更新

### 2. 连续调用多个接口

- ✅ 验证每次响应都返回新 token
- ✅ 验证本地存储持续更新
- ✅ 验证不会出现 token 过期

### 3. App 切换到后台再回到前台

- ✅ 验证自动调用 `/api/auth-jwt/me`
- ✅ 验证获取新 token
- ✅ 验证用户信息更新

### 4. 断网后重新联网

- ✅ 验证自动刷新用户信息
- ✅ 验证获取新 token

### 5. 7 天不使用后再打开 App

- ✅ 验证 token 过期
- ✅ 验证收到 401 错误
- ✅ 验证自动跳转到登录页

### 6. 长时间使用 App（超过 30 分钟）

- ✅ 验证心跳机制自动触发
- ✅ 验证 token 持续有效

## 🔒 安全建议

### 使用 SecureStore 存储 Token（可选）

如果需要更高的安全性，可以将 `AsyncStorage` 替换为 `expo-secure-store`：

修改 `utils/jwtRequest.ts`：

```tsx
import * as SecureStore from 'expo-secure-store';

export const saveJwtToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(JWT_TOKEN_KEY, token);
  } catch (error) {
    console.error('保存 JWT Token 失败:', error);
  }
};

export const getJwtToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('获取 JWT Token 失败:', error);
    return null;
  }
};

export const clearJwtToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('清除 JWT Token 失败:', error);
  }
};
```

## 🐛 常见问题

### 1. 响应头中没有 X-New-Token

- 检查后端是否正确设置响应头
- 检查后端是否启用了 CORS 并暴露了自定义响应头
- 后端需要设置：`Access-Control-Expose-Headers: X-New-Token`

### 2. Token 更新后仍然收到 401 错误

- 检查是否所有请求都使用了 `jwtGet/jwtPost/jwtPut/jwtDel`
- 检查是否有请求绕过了 axios 拦截器
- 确保所有请求都通过 `jwtRequest.ts` 中的 axios 实例

### 3. App 启动时闪现登录页

- 这是正常现象，因为需要时间从本地存储读取 token
- 可以添加启动屏或骨架屏优化体验

### 4. 网络错误时用户被登出

- 检查错误处理逻辑，确保网络错误不会清除 token
- 只有 401 错误才应该清除 token

## 📚 参考资料

- [Axios 拦截器文档](https://axios-http.com/docs/interceptors)
- [Expo SecureStore 文档](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native NetInfo 文档](https://github.com/react-native-netinfo/react-native-netinfo)
- [React Native AppState 文档](https://reactnative.dev/docs/appstate)

## 🎯 下一步

1. 安装依赖：`npm install axios expo-secure-store @react-native-community/netinfo`
2. 修改 `app/_layout.tsx` 使用 `JwtAuthProvider`
3. 修改 `app/login.tsx` 使用 JWT 登录
4. 将现有的 API 调用改为使用 `jwtGet/jwtPost/jwtPut/jwtDel`
5. 测试各种场景，确保功能正常

## 💡 提示

- 可以保留现有的 Session 认证方式，与 JWT 认证并存
- 逐步迁移到 JWT 认证，降低风险
- 建议先在测试环境验证，再部署到生产环境
