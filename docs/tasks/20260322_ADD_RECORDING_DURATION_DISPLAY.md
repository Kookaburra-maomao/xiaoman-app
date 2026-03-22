# 添加录音时长显示和自动发送功能

## 任务时间
2026-03-22

## 需求描述
在按住说话录音时：
1. 显示当前录音时长（格式：00:05）
2. 限制最大录音时长为 60 秒
3. 超过 60 秒自动上传录音并发送消息
4. 在最后 5 秒显示倒计时提示

## 实施方案

### 1. 更新 useRecording Hook
**文件**: `hooks/useRecording.ts`

**修改内容**：
- 添加 `MAX_RECORDING_DURATION` 常量（60秒）
- 添加 `autoStopCallbackRef` 用于保存自动停止回调
- `startRecording` 接受 `onMaxDurationReached` 回调参数
- 在计时器中检查是否达到最大时长，达到时触发回调
- 导出 `maxDuration` 供外部使用

**关键代码**：
```typescript
const MAX_RECORDING_DURATION = 60; // 最大录音时长（秒）

const startRecording = useCallback(async (onMaxDurationReached?: () => void) => {
  // 保存自动停止回调
  autoStopCallbackRef.current = onMaxDurationReached || null;
  
  // 开始计时
  durationIntervalRef.current = setInterval(() => {
    setRecordingDuration((prev) => {
      const newDuration = prev + 1;
      
      // 检查是否达到最大时长
      if (newDuration >= MAX_RECORDING_DURATION) {
        console.log('录音达到最大时长，自动停止');
        // 触发自动停止回调
        if (autoStopCallbackRef.current) {
          autoStopCallbackRef.current();
        }
      }
      
      return newDuration;
    });
  }, 1000);
}, []);
```

### 2. 更新 chat.tsx
**文件**: `app/(tabs)/chat.tsx`

**修改内容**：
- 从 `useRecording` 中获取 `maxDuration`
- 在 `handleVoiceButtonPressIn` 中传入自动停止回调
- 回调函数调用 `handleStopRecording` 自动发送录音
- 将 `maxRecordingDuration` 传递给 `ChatInput` 组件

**关键代码**：
```typescript
const handleVoiceButtonPressIn = useCallback(async () => {
  if (!isRecording) {
    // 传入自动停止回调
    const result = await startRecording(() => {
      // 达到最大时长，自动停止并发送
      console.log('录音达到最大时长，自动发送');
      handleStopRecording();
    });
  }
}, [isGeneratingDiary, isRecording, startRecording, handleStopRecording]);
```

### 3. 更新 ChatInput 组件
**文件**: `components/chat/ChatInput.tsx`

**修改内容**：
- 添加 `maxRecordingDuration` 属性（默认 60 秒）
- 更新 `getRecordingHintText` 函数显示录音时长
- 时长格式：`00:05`（分:秒）
- 最后 5 秒显示倒计时：`00:56 还剩4秒`

**关键代码**：
```typescript
const getRecordingHintText = () => {
  if (isMovingUp) {
    return '松手取消';
  }
  
  // 格式化时长显示：00:05
  const minutes = Math.floor(recordingDuration / 60);
  const seconds = recordingDuration % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // 如果接近最大时长（最后5秒），显示倒计时提示
  const remainingSeconds = maxRecordingDuration - recordingDuration;
  if (remainingSeconds <= 5 && remainingSeconds > 0) {
    return `${timeStr} 还剩${remainingSeconds}秒`;
  }
  
  return `${timeStr} 松手发送 上移取消`;
};
```

## 功能说明

### 录音时长显示
- 格式：`MM:SS`（分:秒）
- 示例：`00:05`、`00:30`、`01:00`
- 实时更新，每秒刷新一次

### 倒计时提示
- 在最后 5 秒显示倒计时
- 格式：`00:56 还剩4秒`
- 提醒用户即将达到最大时长

### 自动发送
- 达到 60 秒时自动停止录音
- 自动上传并识别语音
- 自动发送识别结果
- 无需用户手动松手

### 用户体验
1. **正常录音**：按住说话 → 显示时长 → 松手发送
2. **上移取消**：按住说话 → 上移 → 显示"松手取消" → 松手取消
3. **自动发送**：按住说话 → 60秒后自动发送 → 无需松手

## 完成情况
- ✅ 添加最大录音时长限制（60秒）
- ✅ 实现录音时长显示（MM:SS 格式）
- ✅ 实现倒计时提示（最后5秒）
- ✅ 实现自动停止并发送功能
- ✅ 更新 useRecording Hook
- ✅ 更新 chat.tsx 页面
- ✅ 更新 ChatInput 组件
- ✅ TypeScript 类型检查通过

## 相关文件
- `hooks/useRecording.ts` - 录音 Hook（修改）
- `app/(tabs)/chat.tsx` - 聊天页面（修改）
- `components/chat/ChatInput.tsx` - 输入组件（修改）

## 测试验证

### 测试场景
1. **短时录音（< 60秒）**
   - 按住说话按钮
   - 观察时长显示是否正确
   - 松手后是否正常发送

2. **长时录音（= 60秒）**
   - 按住说话按钮
   - 观察倒计时提示（最后5秒）
   - 验证 60 秒时是否自动发送
   - 验证无需松手即可发送

3. **上移取消**
   - 按住说话按钮
   - 上移手指
   - 观察提示文字变为"松手取消"
   - 松手后验证录音是否取消

4. **时长格式**
   - 验证 0-9 秒显示为 `00:0X`
   - 验证 10-59 秒显示为 `00:XX`
   - 验证 60 秒显示为 `01:00`

### 测试步骤
1. 打开 app，进入聊天页面
2. 切换到语音输入模式
3. 按住说话按钮开始录音
4. 观察录音时长显示
5. 测试不同时长的录音
6. 测试自动发送功能
7. 测试上移取消功能

## 注意事项
1. 自动发送时会调用 `handleStopRecording`，与手动松手发送逻辑相同
2. 倒计时提示只在最后 5 秒显示，避免干扰正常录音
3. 时长显示使用 `padStart` 确保两位数格式
4. 自动停止回调使用 ref 保存，避免闭包问题

## 后续优化建议
1. 添加震动反馈（达到最大时长时）
2. 添加音效提示（最后几秒）
3. 支持自定义最大时长
4. 添加录音波形动画
5. 优化倒计时提示的视觉效果（如变色）
