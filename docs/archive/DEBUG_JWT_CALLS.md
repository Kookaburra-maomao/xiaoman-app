# 调试 JWT 频繁调用问题

## 已添加的调试日志

### 1. JwtAuthContext.tsx
- `[JWT Auth] 刷新用户信息 - 调用栈:` - 显示调用来源
- `[JWT Auth] 网络状态变化:` - 显示网络状态变化详情
- `[JWT Auth] 心跳定时器已存在，跳过创建` - 防止重复创建定时器

### 2. utils/jwtAuth.ts
- `[jwtAuth] jwtGetMe 被调用` - 每次调用都会记录
- `[jwtAuth] jwtGetMe: 没有 token` - 没有 token 时
- `[jwtAuth] jwtGetMe: 发起请求` - 实际发起网络请求
- `[jwtAuth] jwtGetMe: 成功获取用户信息` - 请求成功
- `[jwtAuth] jwtGetMe: 发生错误` - 请求失败

## 优化措施

### 1. 防止重复创建定时器
```typescript
// 避免重复创建定时器
if (heartbeatTimerRef.current) {
  console.log('[JWT Auth] 心跳定时器已存在，跳过创建');
  return;
}
```

### 2. 优化依赖数组
将 `[user]` 改为 `[user?.id]`，避免 user 对象变化导致 useEffect 重复执行

### 3. 优化网络监听
只在网络从断开到连接时刷新，而不是每次网络状态变化都刷新：
```typescript
if (state.isConnected && previousIsConnected === false && user && refreshAuthRef.current) {
  refreshAuthRef.current();
}
```

### 4. 使用 ref 保持函数引用
使用 `refreshAuthRef` 保持 `refreshAuth` 的最新引用，避免依赖数组中包含函数导致重复执行

## 调试步骤

1. **清除应用数据并重新启动**
   - 卸载应用重新安装
   - 或清除应用数据

2. **查看控制台日志**
   运行应用后，查看以下日志：
   
   ```
   [JWT Auth] 初始化认证状态
   [JWT Auth] 本地用户信息: null
   [jwtAuth] jwtGetMe 被调用
   [jwtAuth] jwtGetMe: 发起请求
   [JWT Auth] 服务器用户信息: { id: "xxx", username: "xxx" }
   [JWT Auth] User 状态变化: { id: "xxx", username: "xxx", isAuthenticated: true }
   [JWT Auth] 启动心跳定时器（30 分钟）
   ```

3. **检查是否频繁调用**
   - 如果看到 `[jwtAuth] jwtGetMe 被调用` 频繁出现，查看调用栈
   - 如果看到 `[JWT Auth] 网络状态变化:` 频繁出现，说明网络监听有问题
   - 如果看到 `[JWT Auth] 心跳定时器已存在，跳过创建` 频繁出现，说明 useEffect 在重复执行

4. **分析调用来源**
   查看 `[JWT Auth] 刷新用户信息 - 调用栈:` 的输出，确定是哪个地方在调用

## 预期行为

### 正常情况下的调用时机：
1. **App 启动时**：调用 1 次（初始化）
2. **登录时**：调用 1 次（验证 token）
3. **App 从后台切换到前台**：调用 1 次
4. **网络从断开到连接**：调用 1 次
5. **每 30 分钟**：调用 1 次（心跳）

### 不应该出现的情况：
- ❌ 每秒调用一次
- ❌ 每次渲染都调用
- ❌ 网络状态没变化也调用
- ❌ 用户没有任何操作也频繁调用

## 可能的问题原因

### 1. user 对象频繁变化
**症状**：每次 `setUser` 都创建新对象，导致 useEffect 重复执行
**解决**：使用 `user?.id` 作为依赖，而不是整个 `user` 对象

### 2. 网络监听器问题
**症状**：网络状态频繁变化，每次都触发刷新
**解决**：只在网络从断开到连接时刷新

### 3. 定时器重复创建
**症状**：每次 useEffect 执行都创建新的定时器
**解决**：检查定时器是否已存在，避免重复创建

### 4. refreshAuth 依赖问题
**症状**：refreshAuth 在依赖数组中，每次变化都重新创建 useEffect
**解决**：使用 ref 保持函数引用，不将函数放入依赖数组

## 临时禁用功能（用于测试）

如果需要临时禁用某些功能来定位问题：

### 禁用心跳机制
注释掉心跳 useEffect：
```typescript
// useEffect(() => {
//   // 心跳机制代码
// }, [user?.id]);
```

### 禁用网络监听
注释掉网络监听 useEffect：
```typescript
// useEffect(() => {
//   // 网络监听代码
// }, [user?.id]);
```

### 禁用 App 生命周期监听
注释掉 App 生命周期 useEffect：
```typescript
// useEffect(() => {
//   // App 生命周期代码
// }, [user?.id]);
```

逐个禁用这些功能，看看哪个导致了频繁调用。

## 联系信息

如果问题仍然存在，请提供：
1. 完整的控制台日志（包括调用栈）
2. 调用频率（每秒几次？）
3. 是否在特定操作后出现（登录后？切换页面后？）
