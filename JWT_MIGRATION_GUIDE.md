# JWT 迁移指南

## 📋 从 Session 认证迁移到 JWT 认证

本指南将帮助你从现有的 Session 认证（基于 Cookie）平滑迁移到 JWT 认证。

## 🎯 迁移策略

### 方案 1：渐进式迁移（推荐）

保留现有的 Session 认证，同时添加 JWT 认证，逐步迁移。

优点：
- 风险低，可以随时回滚
- 可以逐个功能模块迁移
- 新老用户可以共存

缺点：
- 需要维护两套认证系统
- 代码复杂度增加

### 方案 2：一次性迁移

直接替换所有认证逻辑为 JWT。

优点：
- 代码简洁，只维护一套认证系统
- 迁移完成后更容易维护

缺点：
- 风险较高
- 需要充分测试
- 可能影响现有用户

## 📝 迁移步骤（渐进式）

### 第 1 步：安装依赖

```bash
./install-jwt-dependencies.sh
```

或手动安装：

```bash
npm install axios @react-native-async-storage/async-storage expo-secure-store @react-native-community/netinfo
```

### 第 2 步：添加 JWT 认证文件

已创建的文件：
- ✅ `utils/jwtRequest.ts` - JWT 请求工具
- ✅ `utils/jwtAuth.ts` - JWT 认证工具函数
- ✅ `contexts/JwtAuthContext.tsx` - JWT 认证上下文
- ✅ `app/jwt-login-example.tsx` - JWT 登录示例

### 第 3 步：修改 App 根组件

修改 `app/_layout.tsx`，同时支持两种认证方式：

```tsx
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { JwtAuthProvider, useJwtAuth } from '@/contexts/JwtAuthContext';

// 创建一个统一的认证 Hook
function useUnifiedAuth() {
  // 优先使用 JWT 认证
  const jwtAuth = useJwtAuth();
  const sessionAuth = useAuth();
  
  // 如果 JWT 已登录，使用 JWT
  if (jwtAuth.isAuthenticated) {
    return {
      ...jwtAuth,
      authType: 'jwt' as const,
    };
  }
  
  // 否则使用 Session
  return {
    ...sessionAuth,
    authType: 'session' as const,
  };
}

function RootLayoutContent() {
  const { isAuthenticated, loading, authType } = useUnifiedAuth();
  
  console.log('[Auth] 当前认证方式:', authType);
  
  // ... 路由守卫逻辑
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <JwtAuthProvider>
        <RootLayoutContent />
      </JwtAuthProvider>
    </AuthProvider>
  );
}
```

### 第 4 步：创建统一的认证 Hook

创建 `hooks/useUnifiedAuth.ts`：

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useJwtAuth } from '@/contexts/JwtAuthContext';

export type AuthType = 'jwt' | 'session';

export interface UnifiedAuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  authType: AuthType;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export function useUnifiedAuth(): UnifiedAuthContextType {
  const jwtAuth = useJwtAuth();
  const sessionAuth = useAuth();
  
  // 优先使用 JWT 认证
  if (jwtAuth.isAuthenticated) {
    return {
      user: jwtAuth.user,
      loading: jwtAuth.loading,
      isAuthenticated: jwtAuth.isAuthenticated,
      authType: 'jwt',
      login: jwtAuth.login,
      logout: jwtAuth.logout,
      refreshAuth: jwtAuth.refreshAuth,
    };
  }
  
  // 使用 Session 认证
  return {
    user: sessionAuth.user,
    loading: sessionAuth.loading,
    isAuthenticated: sessionAuth.isAuthenticated,
    authType: 'session',
    login: async (phone: string, code: string) => {
      // Session 登录逻辑（保持原有逻辑）
      throw new Error('Session 登录暂不支持手机号+验证码');
    },
    logout: sessionAuth.logout,
    refreshAuth: sessionAuth.refreshAuth,
  };
}
```

### 第 5 步：修改登录页面

修改 `app/login.tsx`，添加 JWT 登录选项：

```tsx
import { useJwtAuth } from '@/contexts/JwtAuthContext';

export default function LoginScreen() {
  const [useJwt, setUseJwt] = useState(true); // 默认使用 JWT
  const jwtAuth = useJwtAuth();
  const sessionAuth = useAuth();
  
  const handleVerify = async () => {
    // ... 验证码验证逻辑
    
    try {
      if (useJwt) {
        // JWT 登录
        await jwtAuth.login(trimmedPhone, trimmedCode);
      } else {
        // Session 登录（保持原有逻辑）
        await loginByPhone(trimmedPhone, trimmedCode, false);
        // ...
      }
      
      router.replace('/(tabs)/chat');
    } catch (error) {
      Alert.alert('错误', error.message);
    }
  };
  
  return (
    // ... UI
    <View>
      <Switch
        value={useJwt}
        onValueChange={setUseJwt}
      />
      <Text>使用 JWT 认证</Text>
    </View>
  );
}
```

### 第 6 步：创建统一的请求工具

创建 `utils/unifiedRequest.ts`：

```tsx
import { getJwtToken, jwtGet, jwtPost, jwtPut, jwtDel } from './jwtRequest';
import { get, post, put, del } from './request';

// 检查是否使用 JWT
async function shouldUseJwt(): Promise<boolean> {
  const token = await getJwtToken();
  return !!token;
}

// 统一的 GET 请求
export async function unifiedGet<T = any>(url: string, params?: any): Promise<T> {
  const useJwt = await shouldUseJwt();
  return useJwt ? jwtGet<T>(url, params) : get(url, params);
}

// 统一的 POST 请求
export async function unifiedPost<T = any>(url: string, data?: any): Promise<T> {
  const useJwt = await shouldUseJwt();
  return useJwt ? jwtPost<T>(url, data) : post(url, data);
}

// 统一的 PUT 请求
export async function unifiedPut<T = any>(url: string, data?: any): Promise<T> {
  const useJwt = await shouldUseJwt();
  return useJwt ? jwtPut<T>(url, data) : put(url, data);
}

// 统一的 DELETE 请求
export async function unifiedDel<T = any>(url: string, params?: any): Promise<T> {
  const useJwt = await shouldUseJwt();
  return useJwt ? jwtDel<T>(url, params) : del(url, params);
}
```

### 第 7 步：逐步迁移 API 调用

选择一个功能模块（如计划管理），将其 API 调用改为使用统一请求工具：

修改 `services/planService.ts`：

```tsx
// 旧代码
import { get, post, put, del } from '@/utils/request';

// 新代码
import { unifiedGet as get, unifiedPost as post, unifiedPut as put, unifiedDel as del } from '@/utils/unifiedRequest';

// 其他代码保持不变
```

### 第 8 步：测试

1. 使用 JWT 登录，测试所有功能
2. 使用 Session 登录，测试所有功能
3. 测试 JWT 自动续期
4. 测试 App 生命周期
5. 测试网络状态变化

### 第 9 步：逐步迁移其他模块

重复第 7 步，逐个迁移其他功能模块。

### 第 10 步：移除 Session 认证（可选）

当所有功能都迁移到 JWT 后，可以移除 Session 认证相关代码：

1. 移除 `contexts/AuthContext.tsx`（Session 版本）
2. 移除 `utils/request.js`（Session 版本）
3. 移除 `utils/auth.ts` 中的 Session 相关函数
4. 简化 `app/_layout.tsx`

## 🧪 测试清单

### JWT 认证测试

- [ ] 登录成功，保存 token
- [ ] 请求自动添加 Authorization 头
- [ ] 响应头返回新 token，自动更新
- [ ] 401 错误，清除 token 并跳转登录页
- [ ] App 启动时自动检查 token
- [ ] App 切换到前台时自动刷新
- [ ] 网络恢复时自动刷新
- [ ] 心跳机制正常工作
- [ ] 7 天不使用后 token 过期

### Session 认证测试（如果保留）

- [ ] 登录成功，建立 session
- [ ] Cookie 自动发送
- [ ] 30 分钟无操作自动登出
- [ ] 登出成功，清除 session

### 兼容性测试

- [ ] JWT 用户可以正常使用所有功能
- [ ] Session 用户可以正常使用所有功能
- [ ] JWT 用户登出后可以使用 Session 登录
- [ ] Session 用户登出后可以使用 JWT 登录

## 🐛 常见问题

### 1. JWT 和 Session 同时存在时，如何判断使用哪个？

优先使用 JWT。检查本地是否有 JWT token，如果有则使用 JWT，否则使用 Session。

### 2. 用户从 Session 切换到 JWT 需要重新登录吗？

是的，需要重新登录。因为 JWT 和 Session 是两套独立的认证系统。

### 3. 如何强制所有用户使用 JWT？

在登录页面移除 Session 登录选项，只保留 JWT 登录。

### 4. 迁移过程中出现问题如何回滚？

如果使用渐进式迁移，可以：
1. 将 `useJwt` 默认值改为 `false`
2. 将 API 调用改回使用 `request.js`
3. 重启 App

### 5. JWT token 存储在哪里？

默认存储在 `AsyncStorage`，可以改为 `SecureStore` 提高安全性。

## 📚 参考资料

- [JWT_IMPLEMENTATION_GUIDE.md](./JWT_IMPLEMENTATION_GUIDE.md) - 完整实现指南
- [app/jwt-login-example.tsx](./app/jwt-login-example.tsx) - JWT 登录示例
- [utils/jwtRequest.ts](./utils/jwtRequest.ts) - JWT 请求工具
- [contexts/JwtAuthContext.tsx](./contexts/JwtAuthContext.tsx) - JWT 认证上下文

## 💡 建议

1. 先在开发环境测试，确保功能正常
2. 使用渐进式迁移，降低风险
3. 保留 Session 认证一段时间，作为备用方案
4. 充分测试各种场景，特别是边界情况
5. 监控生产环境，及时发现问题

## 🎯 迁移时间表（建议）

### 第 1 周：准备阶段
- 安装依赖
- 创建 JWT 认证文件
- 修改 App 根组件
- 创建统一认证 Hook

### 第 2 周：试点阶段
- 选择一个功能模块试点
- 充分测试
- 收集反馈

### 第 3-4 周：全面迁移
- 逐个迁移其他功能模块
- 持续测试
- 修复问题

### 第 5 周：稳定阶段
- 监控生产环境
- 优化性能
- 完善文档

### 第 6 周：清理阶段（可选）
- 移除 Session 认证代码
- 代码重构
- 最终测试

祝你迁移顺利！🎉
