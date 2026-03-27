# 修复聊天页面字体缩放问题

## 问题描述

在 vivo 和 iPhone 设备上，当用户设置系统字体为大号字体时，聊天页面的布局和排版会受到影响，导致 UI 错乱。

需要为聊天页面的所有文字组件添加 `allowFontScaling={false}` 属性。

## 功能错误修复

在修复字体缩放问题时，发现了一个功能错误：

**错误信息**：`[ReferenceError: Property 'clearPermissionDenied' doesn't exist]`

**原因**：`hooks/useRecording.ts` 中缺少导入 `clearPermissionDenied`、`hasPermissionDenied`、`markPermissionDenied` 函数。

**修复**：在导入语句中添加缺失的函数：
```typescript
import {
    hasExplainedPermission,
    markPermissionExplained,
    hasPermissionDenied,
    markPermissionDenied,
    clearPermissionDenied,
} from '@/utils/permissionManager';
```

## 受影响的区域

根据用户提供的截图和反馈，聊天页面（chat.tsx）以下区域受到影响：

1. 左侧系统消息（Markdown 渲染的内容）
2. 对话气泡中的汉字（用户消息）
3. "生成日记"按钮文字
4. 输入框中的文字和占位符"输入想要记录的内容"
5. 语音按钮的"按住 说话"文字
6. 日记卡片的日期时间和内容
7. 运营卡片的标题和选项文字
8. 日记预览页的所有文字（日期、天气、时间、内容等）

## 解决方案

### 1. 普通 Text 组件
在所有受影响的 Text 组件上显式添加 `allowFontScaling={false}` 属性。

### 2. TextInput 组件
在 TextInput 组件上添加 `allowFontScaling={false}` 属性。

### 3. Markdown 组件（重要）
对于使用 `react-native-markdown-display` 的内容，由于该库内部使用 Text 组件渲染，需要创建自定义包装组件：

**创建 `components/common/MarkdownText.tsx`**：
- 自定义 Markdown 渲染规则
- 为所有文本节点（text、paragraph、strong、em、heading、link、list_item）添加 `allowFontScaling={false}`
- 替换所有使用 `Markdown` 组件的地方为 `MarkdownText`

这样可以确保 Markdown 渲染的内容（系统消息、日记卡片内容）也不会受系统字体缩放影响。

## 修改的文件和组件

### 1. `hooks/useRecording.ts` - 修复功能错误

**修改**：添加缺失的导入
```typescript
import {
    hasExplainedPermission,
    markPermissionExplained,
    hasPermissionDenied,
    markPermissionDenied,
    clearPermissionDenied,
} from '@/utils/permissionManager';
```

### 2. `components/common/MarkdownText.tsx` - 新建 Markdown 包装组件

**创建新文件**：自定义 Markdown 组件，禁用所有文本的字体缩放

**功能**：
- 覆盖默认的文本渲染器（text、paragraph、strong、em、heading1-3、link、list_item）
- 为每个渲染器添加 `allowFontScaling={false}` 属性
- 保持原有的样式和功能

**使用方式**：
```tsx
import MarkdownText from '@/components/common/MarkdownText';

<MarkdownText style={markdownStyles}>
  {content}
</MarkdownText>
```

### 3. `components/chat/MessageItem.tsx` - 消息气泡

- **用户消息文字**：`<Text allowFontScaling={false} style={[styles.messageText, ...]}>` 
- **系统消息（Markdown）**：使用 `MarkdownText` 组件替代 `Markdown`

### 4. `components/chat/ChatInput.tsx` - 输入框

- **录音提示文字**：在 styles 中添加 `allowFontScaling: false`
- **语音按钮文字**："按住 说话" 和 "..." - 添加 `allowFontScaling={false}`
- **输入框 TextInput**：添加 `allowFontScaling={false}` 属性
- **输入框 placeholder**："输入想要记录的内容" - 通过 TextInput 的 `allowFontScaling={false}` 生效

### 4. `components/chat/DiaryCard.tsx` - 日记卡片

- **日期时间**：`<Text style={styles.dateTimeText} allowFontScaling={false}>`
- **日记内容（Markdown）**：添加 `mergeStyle={true}` 属性（两处）

### 6. `components/chat/OperationCard.tsx` - 运营卡片

- **情况1 - 标题**：`<Text style={styles.type1Text} allowFontScaling={false}>`
- **情况1 - emoji文字**：`<Text style={{...}} allowFontScaling={false}>`
- **情况1 - 选项文字**：`<Text style={styles.type1ItemText} allowFontScaling={false}>`
- **情况2 - 标题**：`<Text style={{...}} allowFontScaling={false}>`
- **情况2 - 按钮文字**：`<Text allowFontScaling={false} style={[styles.type2ButtonText, ...]}>` 
- **情况3 - 标题**：`<Text style={styles.type3Text} allowFontScaling={false}>`

### 7. `components/chat/MessageList.tsx` - 生成日记按钮

- **按钮文字（生成中）**：`<Text style={styles.generateDiaryButtonText} allowFontScaling={false}>正在生成中...</Text>`
- **按钮文字（正常）**：`<Text style={styles.generateDiaryButtonText} allowFontScaling={false}>生成日记</Text>`

### 8. `components/chat/DiaryGenerateModal.tsx` - 日记预览页

- **标题**：`<Text style={styles.title} allowFontScaling={false}>日记</Text>`
- **日期**：`<Text style={styles.dateText} allowFontScaling={false}>`
- **天气**：`<Text style={styles.weatherText} allowFontScaling={false}>`
- **时间**：`<Text style={styles.timeText} allowFontScaling={false}>`
- **生成中提示**：`<Text style={styles.generatingText} allowFontScaling={false}>正在输入...</Text>`
- **日记内容（非 markdown）**：`<Text style={styles.diaryText} allowFontScaling={false}>`
- **日记内容（Markdown）**：使用 `MarkdownText` 组件替代 `Markdown`
- **调试按钮**：`<Text style={styles.debugToggleText} allowFontScaling={false}>`

### 9. `utils/markdownStyles.ts` - Markdown 样式配置

**修改**：在 `getMarkdownStyles` 函数中添加 `text` 样式
```typescript
text: {
  fontSize: scaleSize(16),
  lineHeight: scaleSize(22),
},
```

这样可以确保 Markdown 渲染的文本也不会受系统字体缩放影响。

## 实现细节

### 方法1：直接在 JSX 中添加属性（Text 组件）

```tsx
<Text style={styles.someText} allowFontScaling={false}>
  文字内容
</Text>
```

### 方法2：在组件属性中添加（TextInput 组件）

```tsx
<TextInput
  style={styles.textInput}
  placeholder="输入想要记录的内容"
  allowFontScaling={false}
/>
```

### 方法3：Markdown 组件处理（新方法）

创建自定义 MarkdownText 组件：

```tsx
// components/common/MarkdownText.tsx
import React from 'react';
import { Text } from 'react-native';
import Markdown, { MarkdownProps } from 'react-native-markdown-display';

export default function MarkdownText({ children, style, ...props }: MarkdownTextProps) {
  const rules = {
    text: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.text} allowFontScaling={false}>
          {node.content}
        </Text>
      );
    },
    // ... 其他渲染器
  };

  return (
    <Markdown style={style} rules={rules} {...props}>
      {children}
    </Markdown>
  );
}
```

使用方式：
```tsx
<MarkdownText style={markdownStyles}>
  {content}
</MarkdownText>
```

## 测试验证

1. 在 vivo 或 iPhone 设备上设置系统字体为最大
2. 完全关闭并重新启动 app（不是热更新）
3. 进入聊天页面，检查以下内容：
   - 系统消息（左侧灰色气泡）文字大小是否正常
   - 用户消息（右侧白色气泡）文字大小是否正常
   - "生成日记"按钮文字大小是否正常
   - 输入框占位符"输入想要记录的内容"是否正常
   - 点击语音按钮，"按住 说话"文字是否正常
   - 日记卡片文字大小是否正常
   - 运营卡片标题和选项文字大小是否正常
4. 点击"生成日记"，检查日记预览页：
   - 标题"日记"文字大小是否正常
   - 日期、天气、时间文字大小是否正常
   - 日记内容文字大小是否正常
5. 测试录音功能：
   - 点击"按住 说话"按钮，确认不会报错
   - 验证权限说明弹窗正常显示
   - 验证录音功能正常工作
6. 验证布局是否正常，没有错位或重叠

## 相关文件

- `hooks/useRecording.ts` - 录音 Hook（修复功能错误）
- `components/common/MarkdownText.tsx` - 自定义 Markdown 组件（新建）
- `components/chat/MessageItem.tsx` - 消息气泡组件
- `components/chat/ChatInput.tsx` - 输入框组件
- `components/chat/DiaryCard.tsx` - 日记卡片组件
- `components/chat/OperationCard.tsx` - 运营卡片组件
- `components/chat/MessageList.tsx` - 消息列表组件
- `components/chat/DiaryGenerateModal.tsx` - 日记预览弹窗组件
- `utils/markdownStyles.ts` - Markdown 样式配置
- `utils/disableFontScaling.ts` - 全局字体缩放禁用工具
- `app/_layout.tsx` - 应用入口（调用全局禁用）

## 完成时间

2026-03-25
