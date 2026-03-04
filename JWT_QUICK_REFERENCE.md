# JWT 快速参考

## 🚀 快速开始

### 1. 安装依赖

```bash
./install-jwt-dependencies.sh
```

### 2. 使用 JwtAuthProvider

```tsx
// app/_layout.tsx
import { JwtAuthProvider } from '@/contexts/JwtAuthContext';

export default function RootLayout() {
  return (
    <JwtAuthProvider>
      {/* 你的应用 */}
    </JwtAuthProvider>
  );
}
```

### 3. 登录

```tsx
import { useJwtAuth } from '@/contexts/JwtAuthContext';

const { login } = useJwtAuth();
await login(phone, code);
```

### 4. 发送请求

```tsx
import { jwtGet, jwtPost } from '@/utils/jwtRequest';

const data = await jwtGet('/api/endpoint');
const result = await jwtPost('/api/endpoint', { key: 'value' });
```

## 📦 核心文件

| 文件 | 说明 |
|------|------|
| `utils/jwtRequest.ts` | JWT 请求工具（axios 拦截器） |
| `utils/jwtAuth.ts` | JWT 认证工具函数 |
| `contexts/JwtAuthContext.tsx` | JWT 认证上下文 |
| `app/jwt-login-example.tsx` | JWT 登录示例 |

## 🔧 常用 API

### 认证相关

```tsx
import { useJwtAuth } from '@/contexts/JwtAuthContext';

const {
  user,              // 当前用户
  loading,           // 加载状态
  isAuthenticated,   // 是否已登录
  login,             // 登录
  logout,            // 登出
  refreshAuth,       // 刷新用户信息
  updateUserInfo,    // 更新用户信息
  setUser,           // 设置用户
} = useJwtAuth();
```

### 请求相关

```tsx
import { jwtGet, jwtPost, jwtPut, jwtDel } from '@/utils/jwtRequest';

// GET
const data = await jwtGet<ResponseType>('/api/endpoint', { param: 'value' });

// POST
const result = await jwtPost<ResponseType>('/api/endpoint', { key: 'value' });

// PUT
const updated = await jwtPut<ResponseType>('/api/endpoint', { key: 'value' });

// DELETE
const deleted = await jwtDel<ResponseType>('/api/endpoint', { param: 'value' });
```

### Token 管理

```tsx
import { saveJwtToken, getJwtToken, clearJwtToken } from '@/utils/jwtRequest';

// 保存 token
await saveJwtToken('your-token');

// 获取 token
const token = await getJwtToken();

// 清除 token
await clearJwtToken();
```

### 用户信息管理

```tsx
import { saveJwtUser, getJwtUser, clearJwtUser } from '@/utils/jwtAuth';

// 保存用户信息
await saveJwtUser(user);

// 获取用户信息
const user = await getJwtUser();

// 清除用户信息
await clearJwtUser();
```

## 🎯 自动续期机制

### 触发时机

1. **任何需要认证的接口调用**
   - 自动在请求头添加 `Authorization: Bearer {token}`
   - 响应头返回 `X-New-Token`，自动更新本地存储

2. **App 启动时**
   - 检查本地是否有 token
   - 调用 `/api/auth-jwt/me` 获取用户信息
   - 触发自动续期

3. **App 从后台切换到前台**
   - 自动调用 `/api/auth-jwt/me`
   - 刷新用户信息并触发续期

4. **网络从断开到连接**
   - 自动调用 `/api/auth-jwt/me`
   - 刷新用户信息并触发续期

5. **定期心跳（每 30 分钟）**
   - 自动调用 `/api/auth-jwt/me`
   - 确保长时间使用不掉线

### 工作流程

```
用户登录
  ↓
保存 token 到本地
  ↓
发送请求（自动添加 Authorization 头）
  ↓
服务器验证 token
  ↓
服务器生成新 token
  ↓
响应头返回 X-New-Token
  ↓
客户端自动更新本地 token
  ↓
下次请求使用新 token
```

## 🔒 错误处理

### 401 错误（Token 过期或无效）

```tsx
// 自动处理，无需手动编码
// 1. 清除本地 token
// 2. 清除用户信息
// 3. 触发 onUnauthorizedCallback
// 4. AuthContext 更新状态
// 5. 路由守卫跳转到登录页
```

### 网络错误

```tsx
// 自动处理，返回本地缓存的用户信息
// 不会清除 token，不会触发登出
```

## 📝 后端接口

### 登录

```
POST /api/auth-jwt/login
Body: { phone, code }
Response: { code, message, data: { token, user } }
```

### 获取用户信息

```
GET /api/auth-jwt/me
Headers: Authorization: Bearer {token}
Response: { code, message, data: user }
Response Headers: X-New-Token: {new-token}
```

### 手动刷新

```
POST /api/auth-jwt/refresh
Headers: Authorization: Bearer {token}
Response: { code, message, data: { token } }
```

## 🧪 测试命令

```bash
# 登录测试
curl -X POST http://localhost:3000/api/auth-jwt/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","code":"1234"}'

# 获取用户信息测试
curl -X GET http://localhost:3000/api/auth-jwt/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v  # 查看响应头

# 刷新 token 测试
curl -X POST http://localhost:3000/api/auth-jwt/refresh \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💡 最佳实践

1. **所有需要认证的请求都使用 `jwtGet/jwtPost/jwtPut/jwtDel`**
2. **不要手动管理 token，让拦截器自动处理**
3. **不要在多个地方存储 token，统一使用 `jwtRequest.ts`**
4. **使用 `useJwtAuth` Hook 访问认证状态**
5. **网络错误时不要清除 token，只有 401 才清除**
6. **定期测试 token 过期场景**
7. **监控生产环境的 token 刷新情况**

## 🐛 调试技巧

### 查看 token

```tsx
import { getJwtToken } from '@/utils/jwtRequest';

const token = await getJwtToken();
console.log('当前 token:', token);
```

### 查看用户信息

```tsx
import { getJwtUser } from '@/utils/jwtAuth';

const user = await getJwtUser();
console.log('当前用户:', user);
```

### 查看请求日志

```tsx
// 在 utils/jwtRequest.ts 中已添加日志
// 查看控制台输出：
// [JWT] 检测到新 token，自动更新
// [JWT] 检测到 401 错误，清除 token 并触发登出
```

### 查看认证状态

```tsx
// 在 contexts/JwtAuthContext.tsx 中已添加日志
// 查看控制台输出：
// [JWT Auth] 初始化认证状态
// [JWT Auth] 刷新用户信息
// [JWT Auth] App 切换到前台，刷新用户信息
// [JWT Auth] 网络已连接，刷新用户信息
// [JWT Auth] 心跳：刷新用户信息
```

## 📚 更多文档

- [JWT_IMPLEMENTATION_GUIDE.md](./JWT_IMPLEMENTATION_GUIDE.md) - 完整实现指南
- [JWT_MIGRATION_GUIDE.md](./JWT_MIGRATION_GUIDE.md) - 迁移指南
- [app/jwt-login-example.tsx](./app/jwt-login-example.tsx) - 登录示例

## 🆘 获取帮助

如果遇到问题：

1. 查看控制台日志
2. 检查网络请求（使用 React Native Debugger 或 Flipper）
3. 查看后端日志
4. 参考文档和示例代码
5. 联系技术支持

---

**版本**: 1.0.0  
**最后更新**: 2024-03-03
