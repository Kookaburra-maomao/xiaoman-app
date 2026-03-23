# 防止权限拒绝后频繁弹窗

## 问题描述

根据隐私合规要求，APP 在用户拒绝权限申请后，不应该立即再次弹窗申请权限，除非用户主动触发权限相关功能。

具体问题：
- 用户拒绝麦克风权限申请后，APP 再次向用户弹窗申请权限，影响用户正常使用

## 合规要求

1. 用户拒绝权限申请后，除非主动触发权限所涉及的业务功能，不得立刻再次弹出权限弹窗
2. 用户主动触发权限相关功能时（如点击录音按钮），可以再次申请权限

## 解决方案

### 1. 权限拒绝记录功能

在 `utils/permissionManager.ts` 中添加权限拒绝记录功能：

- `markPermissionDenied(permissionType)` - 记录用户拒绝了该权限
- `hasPermissionDenied(permissionType)` - 检查用户是否拒绝过该权限
- `getPermissionDeniedTime(permissionType)` - 获取权限被拒绝的时间
- `clearPermissionDenied(permissionType)` - 清除权限拒绝记录（用户主动触发时）

### 2. 集成到录音功能

修改 `hooks/useRecording.ts`：

1. **导入拒绝记录相关函数**
   ```typescript
   import { 
     hasExplainedPermission, 
     markPermissionExplained,
     hasPermissionDenied,
     markPermissionDenied,
     clearPermissionDenied,
   } from '@/utils/permissionManager';
   ```

2. **在 actualStartRecording 中记录拒绝**
   - 当用户拒绝权限时（status !== 'granted'），调用 `markPermissionDenied('microphone')`
   - 记录拒绝时间，用于后续判断

3. **在 startRecording 中清除拒绝记录**
   - 用户主动点击录音按钮时，调用 `clearPermissionDenied('microphone')`
   - 表示用户主动触发权限相关功能，可以再次申请权限

## 实现逻辑

```typescript
// 开始录音（带权限说明）
const startRecording = useCallback(async (onMaxDurationReached?: () => void) => {
  try {
    // 用户主动触发录音，清除之前的拒绝记录
    await clearPermissionDenied('microphone');
    
    // 检查是否已经说明过麦克风权限
    const hasExplained = await hasExplainedPermission('microphone');
    
    if (!hasExplained) {
      // 需要先显示权限说明
      setShowPermissionExplain(true);
      pendingStartCallbackRef.current = () => actualStartRecording(onMaxDurationReached);
      return false;
    } else {
      // 已经说明过，直接开始录音
      return await actualStartRecording(onMaxDurationReached);
    }
  } catch (error) {
    console.error('[Recording] 检查权限说明状态失败:', error);
    return await actualStartRecording(onMaxDurationReached);
  }
}, [actualStartRecording]);

// 实际开始录音的逻辑
const actualStartRecording = useCallback(async (onMaxDurationReached?: () => void) => {
  try {
    // 请求录音权限
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      // 记录用户拒绝了麦克风权限
      await markPermissionDenied('microphone');
      Alert.alert('提示', '需要录音权限才能使用语音功能');
      return false;
    }
    
    // ... 继续录音逻辑
  } catch (error) {
    console.error('开始录音失败:', error);
    return false;
  }
}, []);
```

## 用户体验流程

1. **首次使用录音功能**
   - 显示权限说明弹窗
   - 用户点击"允许"后，申请系统权限
   - 如果用户拒绝系统权限，记录拒绝状态

2. **用户拒绝权限后**
   - 不会自动再次弹窗申请权限
   - 只有当用户再次主动点击录音按钮时，才会清除拒绝记录并再次申请

3. **用户主动触发**
   - 用户点击录音按钮
   - 清除之前的拒绝记录
   - 再次申请权限（如果之前被拒绝）

## 测试验证

1. 首次使用录音功能，拒绝权限
2. 验证不会立即再次弹窗
3. 再次点击录音按钮，验证可以再次申请权限
4. 验证拒绝记录被正确清除

## 相关文件

- `utils/permissionManager.ts` - 权限管理工具（包含拒绝记录功能）
- `hooks/useRecording.ts` - 录音 Hook（集成拒绝记录逻辑）
- `app/(tabs)/chat.tsx` - 聊天页面（使用录音功能）

## 完成时间

2026-03-23
