# 添加权限使用说明弹窗

## 任务时间
2026-03-22

## 问题描述
**合规检测发现**：APP 在申请麦克风权限时，未及时通过弹窗、文字、蒙层等形式向用户告知权限使用的目的和用途。

**违规行为**：
1. APP 运行时向用户索取麦克风权限
2. 未在申请前告知权限使用目的
3. 未说明权限使用场景

## 合规要求
APP 运行时，需要通过蒙层、顶层浮栏的形式向用户告知权限使用的目的和用途。

**示例说明**：
- 获取位置信息：根据您的位置为您推荐当地的天气和生活服务信息
- 获取麦克风权限：为您提供录音记录日记的便捷能力

## 解决方案

### 1. 创建权限说明弹窗组件
**文件**: `components/common/PermissionExplainModal.tsx` (新建)

**功能**：
- 显示权限图标
- 说明权限用途
- 列出功能列表
- 提供"去授权"和"暂不授权"按钮

**支持的权限类型**：
- `microphone` - 麦克风权限
- `location` - 位置权限
- `camera` - 相机权限
- `storage` - 存储权限

**麦克风权限说明**：
```
标题：麦克风权限使用说明
描述：为您提供录音记录日记的便捷能力，让您可以通过语音快速记录生活点滴
功能：
  • 语音录制日记
  • 语音转文字
  • 语音聊天记录
```

### 2. 创建权限管理工具
**文件**: `utils/permissionManager.ts` (新建)

**功能**：
- `hasExplainedPermission(type)` - 检查是否已说明过该权限
- `markPermissionExplained(type)` - 标记已说明过该权限
- `clearAllPermissionExplained()` - 清除所有权限说明记录

**实现**：
```typescript
const PERMISSION_EXPLAINED_PREFIX = '@permission_explained_';

export const hasExplainedPermission = async (permissionType: string): Promise<boolean> => {
  const key = `${PERMISSION_EXPLAINED_PREFIX}${permissionType}`;
  const value = await AsyncStorage.getItem(key);
  return value === 'true';
};

export const markPermissionExplained = async (permissionType: string): Promise<void> => {
  const key = `${PERMISSION_EXPLAINED_PREFIX}${permissionType}`;
  await AsyncStorage.setItem(key, 'true');
};
```

### 3. 修改录音 Hook
**文件**: `hooks/useRecording.ts` (修改)

**修改内容**：
- 添加 `showPermissionExplain` 状态
- 在 `startRecording` 前检查是否已说明过权限
- 如果未说明，显示权限说明弹窗
- 用户确认后再申请权限
- 导出 `confirmPermission` 和 `cancelPermission` 方法

**关键逻辑**：
```typescript
const startRecording = useCallback(async (onMaxDurationReached?: () => void) => {
  // 检查是否已经说明过麦克风权限
  const hasExplained = await hasExplainedPermission('microphone');
  
  if (!hasExplained) {
    // 需要先显示权限说明
    setShowPermissionExplain(true);
    // 保存待执行的回调
    pendingStartCallbackRef.current = () => actualStartRecording(onMaxDurationReached);
    return false;
  } else {
    // 已经说明过，直接开始录音
    return await actualStartRecording(onMaxDurationReached);
  }
}, [actualStartRecording]);

const confirmPermission = useCallback(async () => {
  setShowPermissionExplain(false);
  // 标记已说明
  await markPermissionExplained('microphone');
  // 执行待执行的开始录音回调
  if (pendingStartCallbackRef.current) {
    await pendingStartCallbackRef.current();
    pendingStartCallbackRef.current = null;
  }
}, []);
```

### 4. 集成到聊天页面
**文件**: `app/(tabs)/chat.tsx` (修改)

**修改内容**：
- 导入 `PermissionExplainModal` 组件
- 从 `useRecording` 获取权限说明相关状态和方法
- 在页面中渲染权限说明弹窗

**代码**：
```typescript
const {
  isRecording,
  recordingDuration,
  audioLevel,
  maxDuration,
  showPermissionExplain,  // 新增
  startRecording,
  stopRecording,
  cancelRecording,
  uploadAndRecognize,
  confirmPermission,  // 新增
  cancelPermission,   // 新增
} = useRecording();

// 在 return 中添加
<PermissionExplainModal
  visible={showPermissionExplain}
  permissionType="microphone"
  onConfirm={confirmPermission}
  onCancel={cancelPermission}
/>
```

### 5. 移除启动时的权限申请
**文件**: `app/_layout.tsx` (修改)

**修改内容**：
- 移除 app 启动时自动申请录音权限的代码
- 权限申请改为在用户实际使用功能时触发

**原因**：
- 启动时申请权限不符合合规要求
- 应该在用户需要使用功能时才申请
- 申请前必须先说明用途

## 执行流程

### 首次使用录音功能
```
1. 用户点击录音按钮
2. 检查是否已说明过麦克风权限 → 未说明
3. 显示权限说明弹窗 ✅
4. 用户阅读说明
5. 用户点击"去授权"
6. 标记已说明
7. 申请系统权限
8. 开始录音
```

### 再次使用录音功能
```
1. 用户点击录音按钮
2. 检查是否已说明过麦克风权限 → 已说明 ✅
3. 直接申请系统权限
4. 开始录音
```

### 用户拒绝授权
```
1. 用户点击录音按钮
2. 显示权限说明弹窗
3. 用户点击"暂不授权" ✅
4. 关闭弹窗
5. 不申请权限
6. 不开始录音
```

## 完成情况
- ✅ 创建权限说明弹窗组件
- ✅ 创建权限管理工具
- ✅ 修改录音 Hook，集成权限说明逻辑
- ✅ 在聊天页面集成权限说明弹窗
- ✅ 移除启动时的权限申请
- ✅ TypeScript 类型检查通过
- ✅ 支持多种权限类型（麦克风、位置、相机、存储）

## 相关文件
- `components/common/PermissionExplainModal.tsx` - 权限说明弹窗组件（新建）
- `utils/permissionManager.ts` - 权限管理工具（新建）
- `hooks/usePermissionWithExplain.ts` - 带说明的权限申请 Hook（新建，备用）
- `hooks/useRecording.ts` - 录音 Hook（修改）
- `app/(tabs)/chat.tsx` - 聊天页面（修改）
- `app/_layout.tsx` - 根布局（修改，移除启动时权限申请）

## 测试验证

### 测试场景

1. **首次使用录音功能**
   - 打开 app，进入聊天页面
   - 点击录音按钮
   - 验证：应该显示权限说明弹窗
   - 验证：弹窗内容包含标题、描述、功能列表
   - 点击"去授权"
   - 验证：显示系统权限申请对话框
   - 允许权限
   - 验证：开始录音

2. **再次使用录音功能**
   - 重新打开 app
   - 点击录音按钮
   - 验证：不显示权限说明弹窗
   - 验证：直接开始录音

3. **用户拒绝授权**
   - 清除 app 数据
   - 打开 app，点击录音按钮
   - 显示权限说明弹窗
   - 点击"暂不授权"
   - 验证：弹窗关闭
   - 验证：不申请系统权限
   - 验证：不开始录音

4. **系统权限被拒绝**
   - 点击"去授权"
   - 在系统对话框中点击"拒绝"
   - 验证：显示提示"需要录音权限才能使用语音功能"
   - 验证：不开始录音

5. **启动时不申请权限**
   - 清除 app 数据
   - 打开 app
   - 验证：不显示任何权限申请
   - 验证：不显示权限说明弹窗
   - 只有点击录音按钮时才触发

### 测试工具
- 手动测试
- 合规检测工具
- 日志查看

## UI 设计

### 弹窗样式
- 圆角卡片：16px
- 背景色：白色
- 遮罩层：半透明黑色（50%）
- 图标：48px，带圆形背景
- 标题：18px，加粗
- 描述：14px，灰色
- 功能列表：带圆点，14px
- 按钮：圆角22px，高44px

### 颜色规范
- 主色调：`Colors.light.tint`（粉色）
- 文字色：`Colors.light.text`（深色）
- 次要文字：`#666666`（灰色）
- 取消按钮：`#F5F5F5`（浅灰背景）
- 确认按钮：渐变色（粉色）

## 注意事项

1. **首次使用体验**
   - 权限说明弹窗只在首次使用时显示
   - 用户点击"去授权"后，下次不再显示
   - 用户点击"暂不授权"后，下次仍会显示

2. **权限说明记录**
   - 使用 AsyncStorage 持久化存储
   - Key 格式：`@permission_explained_{type}`
   - 退出登录时可选择是否清除

3. **系统权限对话框**
   - 权限说明弹窗 ≠ 系统权限对话框
   - 权限说明弹窗是 app 自己的说明
   - 系统权限对话框是 iOS/Android 的原生对话框
   - 顺序：说明弹窗 → 系统对话框

4. **其他权限**
   - 位置权限、相机权限、存储权限也需要类似处理
   - 已创建通用组件和工具，可复用
   - 需要在对应功能中集成

## 后续优化建议

1. **统一权限管理**
   - 为所有权限申请添加说明弹窗
   - 位置权限（获取天气）
   - 相机权限（拍照记录）
   - 存储权限（保存图片）

2. **权限设置页面**
   - 在设置页面显示所有权限状态
   - 提供跳转到系统设置的入口
   - 说明每个权限的用途

3. **权限被拒绝后的引导**
   - 如果用户拒绝权限，提供引导
   - 说明如何在系统设置中开启权限
   - 提供"去设置"按钮

4. **权限说明内容优化**
   - 根据用户反馈优化说明文案
   - 添加更多使用场景说明
   - 考虑添加示意图或动画

## 相关法规
- 《个人信息保护法》
- 《网络安全法》
- 《App 违法违规收集使用个人信息行为认定方法》
- 工信部《App 用户权益保护测评规范》
- 《常见类型移动互联网应用程序必要个人信息范围规定》
