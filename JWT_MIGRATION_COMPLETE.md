# JWT 认证迁移完成 + 调试日志添加

## 问题诊断

你遇到的问题是：进入 app 后所有接口都失败，返回 401 错误。

根本原因：
- 应用还在使用旧的 session 认证系统（`/api/auth/me`）
- 服务器返回 401，说明 session 已过期或服务器已切换到 JWT
- 虽然有 JWT 认证代码，但应用没有使用它

## 已完成的更改

### 1. 切换到 JWT 认证系统

#### 修改的文件：

**app/_layout.tsx**
- 从 `AuthProvider` 切换到 `JwtAuthProvider`
- 从 `useAuth` 切换到 `useJwtAuth`

**hooks/useAuth.ts**
- 简化为 JWT 认证的导出层
- 重新导出 `useJwtAuth`，保持接口兼容

**app/login.tsx**
- 更新导入：使用 `hooks/useAuth` 而不是 `contexts/AuthContext`
- 简化登录逻辑：直接使用 JWT `login(phone, code)`
- 移除旧的 session 登录逻辑

**所有 app 页面（批量更新）**
- `app/index.tsx`
- `app/(tabs)/chat.tsx`
- `app/(tabs)/record.tsx`
- `app/chat-record-day.tsx`
- `app/diary-detail.tsx`
- `app/diary-edit.tsx`
- `app/diary-recycle-bin.tsx`
- `app/plan-manage.tsx`
- `app/record-detail.tsx`
- `app/settings.tsx`
- `app/vip-center.tsx`

**所有 hooks（批量更新）**
- `hooks/useChat.ts`
- `hooks/usePlan.ts`

所有文件都从 `@/contexts/AuthContext` 改为 `@/hooks/useAuth`

### 2. 添加调试日志

为了帮助你定位 userId 获取问题，在以下位置添加了 console 日志：

#### contexts/JwtAuthContext.tsx
```typescript
- [JWT Auth] 初始化认证状态
- [JWT Auth] 本地用户信息: { id, username }
- [JWT Auth] 服务器用户信息: { id, username }
- [JWT Auth] 登录成功，用户信息: { id, username }
- [JWT Auth] User 状态变化: { id, username, isAuthenticated }
```

#### contexts/AuthContext.tsx（旧的，现在不再使用）
```typescript
- [AuthContext] 初始化认证状态
- [AuthContext] 本地用户信息: { id, username }
- [AuthContext] 服务器用户信息: { id, username }
- [AuthContext] User 状态变化: { id, username, isAuthenticated }
```

#### hooks/useChat.ts
```typescript
- [useChat] User 状态: { id, username }
- [useChat] sendMessage 调用，user.id: xxx
- [useChat] sendMessage 条件不满足: { hasContent, isSending, hasUserId }
- [useChat] 准备调用 sendChatMessage，userId: xxx
```

#### services/chatService.ts
```typescript
- [chatService] sendChatMessage 调用，userId: xxx
- [chatService] 请求体: { userId, userContentLength, hasLocation }
- [chatService] 请求失败，状态码: xxx
```

#### hooks/usePlan.ts
```typescript
- [usePlan] fetchPlans 调用，user.id: xxx
- [usePlan] fetchPlans 失败：user.id 不存在
- [usePlan] 准备调用 planService.fetchActivePlans，userId: xxx
```

#### services/planService.ts
```typescript
- [planService] fetchActivePlans 调用，userId: xxx
- [planService] fetchActivePlans 响应: { code, dataLength }
```

#### utils/request.js
```typescript
- [request] 发起请求: { method, url, params, hasBody }
- [request] 响应状态: { url, status, ok }
- [request] 请求失败: { url, status, message, errors }
```

## JWT 认证工作流程

### 登录流程
1. 用户输入手机号和验证码
2. 调用 `login(phone, code)` → `jwtLogin(phone, code)`
3. 服务器返回 `{ token, user }`
4. 保存 token 到 AsyncStorage (`@xiaoman_jwt_token`)
5. 保存 user 到 AsyncStorage (`@xiaoman_jwt_user`)
6. 更新 Context 状态

### 自动续期机制
1. 每次请求自动在 header 添加 `Authorization: Bearer {token}`
2. 服务器检测到 token 即将过期时，返回新 token（响应头 `X-New-Token`）
3. 客户端自动检测并保存新 token
4. 无需用户感知，自动续期

### 会话保持
- App 启动时自动检查本地 token
- 调用 `/api/auth-jwt/me` 验证并刷新用户信息
- App 切换到前台时自动刷新
- 网络恢复时自动刷新
- 每 30 分钟心跳刷新

### 401 处理
- 检测到 401 错误时自动清除 token 和用户信息
- 触发登出回调，跳转到登录页

## 测试步骤

1. **清除旧数据**（重要！）
   ```bash
   # 在模拟器/设备上卸载应用重新安装
   # 或者清除应用数据
   ```

2. **重新登录**
   - 使用测试账号：18610995540
   - 验证码：5540

3. **查看控制台日志**
   - 应该看到 `[JWT Auth]` 开头的日志
   - 确认 user.id 正确获取
   - 确认接口调用时 userId 正确传递

4. **验证功能**
   - 聊天功能
   - 计划功能
   - 日记功能
   - 所有接口应该正常工作

## 预期的日志输出

### 成功的登录流程
```
[JWT Auth] 初始化认证状态
[JWT Auth] 本地用户信息: null
[JWT Auth] 服务器用户信息: null
[JWT Auth] User 状态变化: { isAuthenticated: false }
// 用户输入手机号和验证码，点击登录
[JWT Auth] 登录成功，用户信息: { id: "xxx", username: "xxx" }
[JWT Auth] User 状态变化: { id: "xxx", username: "xxx", isAuthenticated: true }
```

### 成功的接口调用
```
[useChat] User 状态: { id: "xxx", username: "xxx" }
[useChat] sendMessage 调用，user.id: xxx
[useChat] 准备调用 sendChatMessage，userId: xxx
[chatService] sendChatMessage 调用，userId: xxx
[chatService] 请求体: { userId: "xxx", userContentLength: 1, hasLocation: false }
[request] 发起请求: { method: "POST", url: "/api/chat", params: undefined, hasBody: true }
[request] 响应状态: { url: "/api/chat", status: 200, ok: true }
```

## 如果还有问题

### 检查清单
1. ✅ 确认服务器支持 JWT 认证（`/api/auth-jwt/login` 和 `/api/auth-jwt/me`）
2. ✅ 确认 `.env` 中的 `EXPO_PUBLIC_XIAOMAN_API_URL` 正确
3. ✅ 清除旧的 session/cookie 数据
4. ✅ 查看控制台日志，找到失败的具体位置
5. ✅ 检查网络请求，确认 Authorization header 是否正确

### 常见问题

**问题：登录后立即返回 401**
- 原因：服务器 JWT 配置问题
- 解决：检查服务器日志，确认 JWT secret 和过期时间配置

**问题：user.id 为 null**
- 原因：token 无效或过期
- 解决：清除应用数据，重新登录

**问题：接口调用时 userId 为 undefined**
- 原因：Context 状态未正确传递
- 解决：查看日志，确认 `[useChat] User 状态` 是否正确

## 回滚方案

如果需要回滚到旧的 session 认证：

1. 恢复 `app/_layout.tsx`：使用 `AuthProvider`
2. 恢复 `hooks/useAuth.ts`：使用旧的实现
3. 恢复 `app/login.tsx`：使用旧的登录逻辑

但建议继续使用 JWT，因为它更安全、更灵活。
