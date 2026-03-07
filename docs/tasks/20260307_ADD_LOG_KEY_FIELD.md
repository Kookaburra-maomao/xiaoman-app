# 添加 log_key 字段到日志服务

## 任务时间
2026-03-07

## 任务目标
服务端日志接口增加了 `log_key` 字段，需要同步更新客户端日志服务，在发送日志时包含 `log_key`（即 `LOG_POSITIONS` 对象中的 key）。

## 服务端接口变更

### 1. 创建日志接口（POST /api/user-logs）
- ✅ 添加 `log_key` 参数接收
- ✅ 更新 INSERT 语句包含 `log_key` 字段

### 2. 时间区间统计接口（GET /api/user-logs/stats/daily）
- ✅ 添加 `log_key` 查询参数
- ✅ 更新 WHERE 条件支持 `log_key` 过滤
- ✅ 更新 GROUP BY 包含 `log_key`
- ✅ 返回结果包含 `log_key` 字段

### 3. 单日统计接口（GET /api/user-logs/stats/spm）
- ✅ 添加 `log_key` 查询参数
- ✅ 更新 WHERE 条件支持 `log_key` 过滤
- ✅ 更新 GROUP BY 包含 `log_key`
- ✅ 返回结果包含 `log_key` 字段

## 客户端修改内容

### 修改文件
- `services/logService.ts`

### 具体变更

#### 1. 更新 LogParams 接口
添加 `log_key` 字段：

```typescript
export interface LogParams {
  type: 'expo' | 'click' | 'success';
  spma: string;
  spmb: string;
  spmc: string;
  spmd: string;
  log_key: string;  // 新增字段
  extrinfo?: string;
  user_id: string;
}
```

#### 2. 更新 sendLog 函数签名
添加 `positionKey` 参数，用于传递 log_key：

```typescript
export const sendLog = async (
  positionKey: keyof typeof LOG_POSITIONS,  // 新增参数
  logConfig: typeof LOG_POSITIONS[keyof typeof LOG_POSITIONS],
  userId: string,
  extraInfo?: Record<string, any>
): Promise<void> => {
  // ...
  const logData: LogParams = {
    type: logConfig.type,
    spma: logConfig.spma,
    spmb: logConfig.spmb,
    spmc: logConfig.spmc,
    spmd: logConfig.spmd,
    log_key: positionKey,  // 新增字段
    user_id: userId,
  };
  // ...
}
```

#### 3. 更新 logByPosition 函数调用
传递 `positionKey` 给 `sendLog`：

```typescript
export const logByPosition = (
  positionKey: keyof typeof LOG_POSITIONS,
  userId: string,
  extraInfo?: Record<string, any>
): void => {
  const logConfig = LOG_POSITIONS[positionKey];
  if (logConfig) {
    sendLog(positionKey, logConfig, userId, extraInfo);  // 传递 positionKey
  }
};
```

## log_key 示例

根据 `LOG_POSITIONS` 对象，`log_key` 的值包括：

- `CHAT_TAB_EXPO` - 对话tab曝光
- `SEND_MESSAGE` - 发送消息给模型
- `GENERATE_DIARY_BUTTON` - 点击生成日记按钮
- `DIARY_PREVIEW_EXPO` - 日记预览页展现
- `PLAN_TAB_EXPO` - 计划tab曝光
- `RECORD_TAB_EXPO` - 记录tab曝光
- `SETTING_PAGE_EXPO` - 设置页面曝光
- ... 等 43 个位置

## 发送到服务端的数据格式

```json
{
  "type": "expo",
  "spma": "chat",
  "spmb": "chat_tab",
  "spmc": "page",
  "spmd": "expo",
  "log_key": "CHAT_TAB_EXPO",
  "user_id": "c9faafdd942d57ce",
  "extrinfo": "{\"page\":\"首页\"}"
}
```

## 兼容性说明

### 对现有代码的影响
- ✅ `useLog` hook 无需修改（内部调用 `logByPosition`）
- ✅ 所有使用 `logByPosition` 的代码无需修改（函数签名未变）
- ✅ 没有其他地方直接调用 `sendLog` 函数

### 向后兼容
- 客户端现在会发送 `log_key` 字段
- 如果服务端不支持该字段，会被忽略（不影响功能）
- 如果服务端支持该字段，可以用于更精确的日志统计和分析

## 测试验证

### 验证步骤
1. ✅ TypeScript 编译检查通过
2. ⏳ 运行应用，触发任意打点操作
3. ⏳ 检查网络请求，确认 `log_key` 字段已包含
4. ⏳ 验证服务端正确接收并存储 `log_key`

### 预期结果
所有日志请求都应包含 `log_key` 字段，值为对应的 `LOG_POSITIONS` key。

## 后续工作

### 服务端统计功能
有了 `log_key` 字段后，服务端可以：
1. 按 `log_key` 统计各个位置的打点次数
2. 分析用户行为路径
3. 生成更精确的数据报表
4. 支持按 `log_key` 过滤和查询日志

### 客户端优化
1. 可以考虑添加日志批量发送功能
2. 添加日志本地缓存，网络恢复后重发
3. 添加日志采样率控制

## 注意事项

1. `log_key` 必须与 `LOG_POSITIONS` 中定义的 key 完全一致
2. 日志发送仍然是异步的，不阻塞主流程
3. 发送失败会静默处理，不影响用户体验
4. 所有现有的打点代码无需修改，自动包含 `log_key`

## 相关文档
- [日志跟踪指南](../logging/LOG_TRACKING_GUIDE.md)
- [日志实现总结](../logging/LOG_IMPLEMENTATION_FINAL_SUMMARY.md)
- [会话延续文档](20260307_SESSION_CONTINUATION.md)
