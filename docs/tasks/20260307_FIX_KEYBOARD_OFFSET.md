# 修复键盘弹起时输入框位置偏上问题

## 任务时间
2026-03-07

## 问题描述
在对话页面点击输入框时，键盘弹起后输入框位置偏上，用户体验不佳。

## 问题原因
`KeyboardAvoidingView` 的 `keyboardVerticalOffset` 配置不正确，导致键盘弹起时计算的偏移量有误。

## 解决方案

### 方案1：调整 keyboardVerticalOffset（已实施）
**文件**: `app/(tabs)/chat.tsx`

将 `keyboardVerticalOffset` 设置为 0：

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.keyboardView}
  keyboardVerticalOffset={0}
>
```

**原因**：
- 使用 `SafeAreaView` 的 `edges={['top']}` 时，已经处理了顶部安全区域
- 不需要额外的垂直偏移量
- 设置为 0 可以让 `KeyboardAvoidingView` 自动计算正确的偏移

### 方案2：使用 position behavior（备选）
如果方案1不生效，可以尝试使用 `position` behavior：

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'position' : 'height'}
  style={styles.keyboardView}
  keyboardVerticalOffset={0}
>
```

**说明**：
- `padding`: 调整内边距（最常用）
- `height`: 调整高度
- `position`: 调整位置（适合某些特殊布局）

### 方案3：动态计算偏移量（高级方案）
如果以上方案都不生效，可以动态计算偏移量：

```typescript
const insets = useSafeAreaInsets();
const keyboardVerticalOffset = Platform.OS === 'ios' ? -insets.bottom : 0;

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.keyboardView}
  keyboardVerticalOffset={keyboardVerticalOffset}
>
```

### 方案4：使用 react-native-keyboard-aware-scroll-view（终极方案）
如果内置的 `KeyboardAvoidingView` 无法满足需求，可以使用第三方库：

```bash
npx expo install react-native-keyboard-aware-scroll-view
```

```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

<KeyboardAwareScrollView
  style={styles.container}
  contentContainerStyle={styles.content}
  enableOnAndroid={true}
  extraScrollHeight={20}
>
  {/* 内容 */}
</KeyboardAwareScrollView>
```

## 测试步骤

1. 打开对话页面
2. 点击输入框
3. 观察键盘弹起后输入框的位置
4. 验证输入框是否在合适的位置（不会被键盘遮挡，也不会偏上太多）
5. 测试输入文字时的体验
6. 测试键盘收起后的布局恢复

## 相关配置

### SafeAreaView 配置
```typescript
<SafeAreaView style={styles.container} edges={['top']}>
```

- `edges={['top']}`: 只处理顶部安全区域
- 底部不使用安全区域，让键盘可以正常覆盖

### KeyboardAvoidingView 配置
```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.keyboardView}
  keyboardVerticalOffset={0}
>
```

- iOS 使用 `padding` behavior
- Android 使用 `height` behavior
- 偏移量设置为 0

## 注意事项

1. **平台差异**: iOS 和 Android 的键盘行为不同，需要分别处理
2. **安全区域**: 使用 `SafeAreaView` 时要注意 `edges` 配置
3. **嵌套布局**: `KeyboardAvoidingView` 应该包裹整个需要避让的内容
4. **测试设备**: 在真机上测试效果，模拟器可能表现不一致
5. **刘海屏**: 注意在刘海屏设备上的表现

## 调试技巧

### 1. 添加边框查看布局
```typescript
<KeyboardAvoidingView
  style={[styles.keyboardView, { borderWidth: 2, borderColor: 'red' }]}
>
```

### 2. 监听键盘事件
```typescript
useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener(
    'keyboardDidShow',
    (e) => {
      console.log('键盘高度:', e.endCoordinates.height);
    }
  );
  
  return () => {
    keyboardDidShowListener.remove();
  };
}, []);
```

### 3. 查看视图层级
使用 React Native Debugger 或 Flipper 查看视图层级，确认布局结构。

## 常见问题

### Q1: 为什么 iOS 和 Android 表现不一致？
A: iOS 和 Android 的键盘实现机制不同，需要使用不同的 behavior。

### Q2: 为什么设置了 keyboardVerticalOffset 还是不对？
A: 可能是因为 SafeAreaView 已经处理了部分偏移，导致重复计算。尝试设置为 0。

### Q3: 为什么在模拟器上正常，真机上不正常？
A: 模拟器和真机的键盘行为可能不同，建议以真机测试为准。

### Q4: 输入框被键盘遮挡怎么办？
A: 检查 KeyboardAvoidingView 是否正确包裹了输入框，以及 behavior 是否设置正确。

## 相关文档
- [React Native KeyboardAvoidingView 文档](https://reactnative.dev/docs/keyboardavoidingview)
- [React Native SafeAreaView 文档](https://reactnative.dev/docs/safeareaview)
- [AI 协作约定](../../AI_CONVENTIONS.md)
