# 修复重复调用问题

## 问题描述

登录成功后出现以下问题：
1. 调用了两次 `/api/auth-jwt/me`
2. 调用了两次 `/api/memory`，且第二次没有携带 `user_id`

## 问题原因分析

### 1. 两次调用 `/api/auth-jwt/me`

**原因**：
- App 启动时，`JwtAuthContext` 的初始化 useEffect 会调用一次 `jwtGetMe()`
- 登录成功后，虽然已经有了用户信息，但初始化逻辑还是会再次调用 `jwtGetMe()`

**解决方案**：
在初始化时检查是否有 token，如果没有 token 就跳过服务器验证

```typescript
// 只有在有 token 的情况下才调用
const token = await getJwtToken();
if (token) {
  const serverUser = await jwtGetMe();
  // ...
} else {
  console.log('[JWT Auth] 没有 token，跳过服务器验证');
}
```

### 2. 两次调用 `/api/memory`，第二次没有 user_id

**原因**：
- `initUserMemory` 函数的依赖是 `[user?.id]`
- 当 user 对象变化时（即使 id 相同），函数会重新创建
- `useFocusEffect` 的依赖数组包含 `initUserMemory`
- 每次 `initUserMemory` 重新创建，`useFocusEffect` 就会重新执行
- 可能在 user 还没完全更新时就被调用，导致 `user?.id` 为 undefined

**解决方案**：
已添加详细日志来追踪调用时机和 user.id 的值

## 已添加的调试日志

### hooks/useChat.ts
```typescript
console.log('[initUserMemory] 被调用，user?.id:', user?.id, 'hasLoadedMemoryRef:', hasLoadedMemoryRef.current);
console.log('[initUserMemory] 跳过：', !user?.id ? '没有 user.id' : '已加载过');
console.log('[initUserMemory] 开始初始化用户记忆，userId:', user.id);
```

### services/chatService.ts
```typescript
console.log('[chatService] getUserMemory 被调用，userId:', userId);
console.log('[chatService] getUserMemory 请求 URL:', `${apiUrl}/api/memory?${params.toString()}`);
console.log('[chatService] getUserMemory 响应失败，status:', response.status);
console.log('[chatService] getUserMemory 成功');
```

### contexts/JwtAuthContext.tsx
```typescript
console.log('[JWT Auth] 有 token，验证用户信息');
console.log('[JWT Auth] 没有 token，跳过服务器验证');
```

## 测试步骤

1. **清除应用数据并重新启动**
2. **登录**，查看控制台日志
3. **观察以下日志**：

### 预期的正常日志流程

```
[JWT Auth] 初始化认证状态
[JWT Auth] 本地用户信息: null
[JWT Auth] 没有 token，跳过服务器验证
[JWT Auth] User 状态变化: { isAuthenticated: false }

// 用户登录
[JWT Auth] 登录成功，用户信息: { id: "xxx", username: "xxx" }
[JWT Auth] User 状态变化: { id: "xxx", username: "xxx", isAuthenticated: true }

// 进入聊天页面
[initUserMemory] 被调用，user?.id: xxx, hasLoadedMemoryRef: false
[initUserMemory] 开始初始化用户记忆，userId: xxx
[chatService] getUserMemory 被调用，userId: xxx
[chatService] getUserMemory 请求 URL: http://xiaomanriji.com/api/memory?user_id=xxx
[chatService] getUserMemory 成功
```

### 如果出现问题

**如果看到两次 `/api/auth-jwt/me`**：
- 检查是否有 `[JWT Auth] 有 token，验证用户信息` 出现两次
- 检查是否有其他地方调用了 `refreshAuth()`

**如果看到两次 `/api/memory`**：
- 检查 `[initUserMemory] 被调用` 出现了几次
- 检查第二次调用时 `user?.id` 的值是什么
- 如果 `user?.id` 是 undefined，说明 user 状态还没更新完成

**如果第二次 `/api/memory` 没有 user_id**：
- 查看日志中的 `userId:` 值
- 如果是 undefined，说明 `user?.id` 在调用时为空
- 可能是 `useFocusEffect` 在 user 更新前就执行了

## 可能的进一步优化

### 1. 优化 initUserMemory 的调用时机

在 chat.tsx 中，可以添加条件判断：

```typescript
useFocusEffect(
  useCallback(() => {
    // 只有在 user 存在时才初始化记忆
    if (user?.id) {
      initUserMemory();
    }
    // ...
  }, [user?.id, initUserMemory, ...])
);
```

### 2. 使用 ref 避免函数重新创建

```typescript
const initUserMemoryRef = useRef<() => Promise<void>>();

useEffect(() => {
  initUserMemoryRef.current = initUserMemory;
}, [initUserMemory]);

// 在 useFocusEffect 中使用 ref
useFocusEffect(
  useCallback(() => {
    if (user?.id && initUserMemoryRef.current) {
      initUserMemoryRef.current();
    }
    // ...
  }, [user?.id, ...]) // 不包含 initUserMemory
);
```

### 3. 防抖处理

如果问题仍然存在，可以添加防抖逻辑：

```typescript
const initUserMemory = useCallback(async () => {
  // 添加短暂延迟，确保 user 状态已更新
  await new Promise(resolve => setTimeout(resolve, 100));
  
  if (!user?.id || hasLoadedMemoryRef.current) {
    return;
  }
  // ...
}, [user?.id]);
```

## 下一步

请运行应用并提供完整的控制台日志，特别是：
1. 从登录到进入聊天页面的完整日志
2. 所有 `[initUserMemory]` 相关的日志
3. 所有 `[chatService] getUserMemory` 相关的日志
4. 所有 `[JWT Auth]` 相关的日志

这样我可以准确定位问题并提供针对性的解决方案。
