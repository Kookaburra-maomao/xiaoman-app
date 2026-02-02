# 运营卡片显示逻辑整理

## 概述
运营卡片（OperationCard）是聊天页面顶部的一个可展开/收起的卡片组件，用于展示运营内容和快捷操作。

## 显示状态控制变量
- **状态变量**: `showCard` (boolean)
- **位置**: `app/(tabs)/chat.tsx`

---

## 何时显示运营卡片 `setShowCard(true)`

### 1. 首次进入应用
**位置**: `checkShouldShowCard()` 函数
```typescript
if (!lastShownTimestamp) {
  // 没有缓存，首次进入，展示卡片并记录时间戳
  setShowCard(true);
  await AsyncStorage.setItem(CARD_TIMESTAMP_KEY, Date.now().toString());
}
```
**触发时机**: 用户首次打开应用，本地没有运营卡片展示记录

---

### 2. 距离上次展示超过30分钟
**位置**: `checkShouldShowCard()` 函数
```typescript
if (timeDiff > thirtyMinutesInMs) {
  // 超过30分钟，展示卡片并更新时间戳
  setShowCard(true);
  await AsyncStorage.setItem(CARD_TIMESTAMP_KEY, currentTime.toString());
}
```
**触发时机**: 
- 用户重新进入聊天页面
- 距离上次展示运营卡片已超过30分钟
- 通过 `useFocusEffect` 在页面聚焦时检查

---

### 3. 检查失败时的默认行为
**位置**: `checkShouldShowCard()` 函数的 catch 块
```typescript
catch (error) {
  console.error('检查运营卡片展示状态失败:', error);
  // 出错时默认展示卡片
  setShowCard(true);
}
```
**触发时机**: AsyncStorage 读取失败或其他异常情况

---

### 4. 用户手动切换（点击头部按钮）
**位置**: `ChatHeader` 组件的 `onToggleCard` 回调
```typescript
<ChatHeader
  showCard={showCard}
  onToggleCard={() => setShowCard(!showCard)}
  ...
/>
```
**触发时机**: 
- 用户点击头部中间的方向切换按钮
- 如果当前是隐藏状态，则切换为显示
- **注意**: 如果正在流式传输（`isStreaming`），会弹出提示"回复中，请稍后"，不会切换状态

---

## 何时隐藏运营卡片 `setShowCard(false)`

### 1. 距离上次展示未超过30分钟
**位置**: `checkShouldShowCard()` 函数
```typescript
if (timeDiff <= thirtyMinutesInMs) {
  // 未超过30分钟，不展示卡片
  setShowCard(false);
}
```

---

### 2. 键盘弹出时
**位置**: 键盘监听器
```typescript
Keyboard.addListener('keyboardWillShow', () => {
  setCardStateBeforeKeyboard(showCard);
  if (showCard) {
    setShowCard(false);
  }
});
```
**触发时机**: 用户点击输入框，键盘即将显示

---

### 3. 输入框获得焦点时
**位置**: `ChatInput` 组件的 `onInputFocus` 回调
```typescript
<ChatInput
  ...
  onInputFocus={() => setShowCard(false)}
/>
```
**触发时机**: 用户点击文本输入框

---

### 4. 语音识别完成并发送消息时
**位置**: `handleStopRecording()` 函数
```typescript
if (recognizedText?.trim()) {
  setShowCard(false);
  await sendMessage(trimmedText, scrollToBottom);
}
```
**触发时机**: 用户完成语音录音，识别成功后自动发送消息

---

### 5. 选择图片后
**位置**: `openImagePicker()` 函数（两处）
```typescript
// 拍照
if (!result.canceled && result.assets[0]) {
  setShowCard(false);
  await uploadImageAndUnderstand(result.assets[0].uri, scrollToBottom);
}

// 从相册选择
if (!result.canceled && result.assets[0]) {
  setShowCard(false);
  await uploadImageAndUnderstand(result.assets[0].uri, scrollToBottom);
}
```
**触发时机**: 用户选择图片（拍照或相册）后

---

### 6. 选择运营卡片选项时
**位置**: `handleOperationItemSelect()` 函数
```typescript
const message = `${promptRule} : ${emoji}`;
setShowCard(false);
sendMessage(message, scrollToBottom, true);
```
**触发时机**: 用户点击运营卡片中的某个选项（如心情emoji）

---

### 7. 发送文本消息时
**位置**: `handleSendMessage()` 函数
```typescript
setShowCard(false);
sendMessage(messageToSend, scrollToBottom);
```
**触发时机**: 用户点击发送按钮发送文本消息

---

### 8. 滚动聊天列表时
**位置**: `handleScroll()` 函数
```typescript
const handleScroll = useCallback(() => {
  if (showCard) {
    setShowCard(false);
  }
}, [showCard]);
```
**触发时机**: 用户滚动聊天消息列表

---

### 9. 用户手动切换（点击头部按钮）
**位置**: `ChatHeader` 组件的 `onToggleCard` 回调
```typescript
onToggleCard={() => setShowCard(!showCard)}
```
**触发时机**: 
- 用户点击头部中间的方向切换按钮
- 如果当前是显示状态，则切换为隐藏

---

## 特殊行为

### 键盘收起时恢复之前的状态
**位置**: 键盘监听器
```typescript
Keyboard.addListener('keyboardWillHide', () => {
  // 键盘收起时，恢复之前的卡片状态
  setShowCard(cardStateBeforeKeyboard);
});
```
**说明**: 
- 键盘弹出前会保存当前卡片状态到 `cardStateBeforeKeyboard`
- 键盘收起后会恢复到之前的状态
- 这样可以避免键盘收起后卡片状态丢失

---

## 动画效果
运营卡片的显示/隐藏使用了动画效果：
- **透明度动画**: `cardSlideAnim` (0 到 1)
- **位移动画**: `cardTranslateY` (-60 到 0)
- **动画时长**: 200ms
- **效果**: 渐显/渐隐 + 下拉/上拉

---

## 缓存机制
- **缓存键**: `@operation_card_last_shown`
- **存储内容**: 上次展示运营卡片的时间戳
- **时间间隔**: 30分钟
- **目的**: 避免频繁展示运营卡片，提升用户体验

---

## 总结

### 显示运营卡片的场景（3种）：
1. ✅ 首次进入应用
2. ✅ 距离上次展示超过30分钟
3. ✅ 用户手动点击头部按钮切换（从隐藏到显示）

### 隐藏运营卡片的场景（9种）：
1. ❌ 距离上次展示未超过30分钟
2. ❌ 键盘弹出
3. ❌ 输入框获得焦点
4. ❌ 语音识别完成并发送
5. ❌ 选择图片
6. ❌ 选择运营卡片选项
7. ❌ 发送文本消息
8. ❌ 滚动聊天列表
9. ❌ 用户手动点击头部按钮切换（从显示到隐藏）

### 设计原则：
- **主动展示**: 仅在合适的时机（首次进入、长时间未展示）主动显示
- **用户操作优先**: 任何用户交互（输入、发送、滚动等）都会隐藏卡片
- **状态保持**: 键盘弹出/收起时会保持之前的状态
- **流式传输保护**: AI 回复时禁止切换卡片状态
