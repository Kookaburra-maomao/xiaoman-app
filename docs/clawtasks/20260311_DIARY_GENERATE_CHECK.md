# 生成日记前检查用户消息长度

## 任务时间
2026-03-11

## 任务来源
Kookaburra (飞书群聊)

## 任务目标
在 chat.tsx 页面点击"生成日记"按钮时，先检查 history list 中 role 为 user 的消息字符长度，如果少于 20 个汉字（40 个字符），不继续执行生成日记逻辑，并 Toast 提示用户："聊的太少啦，再多聊一点吧"

## 实现方案

### 1. 检查逻辑
- 从 `assistantHistory` 中筛选 `role === 'user'` 的消息
- 过滤掉 `[图片]` 占位符，只统计实际文字内容
- 计算总字符数，判断是否 >= 40 字符（约 20 个汉字）

### 2. 提示方式
- 使用项目已有的 `Toast` 组件（`@/components/common/Toast`）
- 显示提示："聊的太少啦，再多聊一点吧"

### 3. 修改文件
- `app/(tabs)/chat.tsx`

## 执行步骤

1. ✅ 阅读 chat.tsx 和 useChat.ts 了解现有代码结构
2. ✅ 确认项目已有 Toast 组件
3. ✅ 修改 chat.tsx：
   - 导入 Toast 组件
   - 从 useChat 获取 assistantHistory
   - 添加 toastVisible 和 toastMessage 状态
   - 修改 handleGenerateDiary 添加检查逻辑
   - 在 JSX 中添加 Toast 组件
4. ⏳ 安装依赖并测试验证

## 完成情况
- ✅ 代码修改完成
- ⏳ 待测试验证

## 相关文件
- `app/(tabs)/chat.tsx` - 主要修改文件
- `hooks/useChat.ts` - 提供 assistantHistory 数据
- `components/common/Toast.tsx` - 复用现有 Toast 组件

## 代码变更

### chat.tsx 新增导入
```typescript
import Toast from '@/components/common/Toast';
```

### chat.tsx 新增状态
```typescript
const [toastVisible, setToastVisible] = useState(false);
const [toastMessage, setToastMessage] = useState('');
```

### handleGenerateDiary 修改
```typescript
const handleGenerateDiary = useCallback(() => {
  // 检查用户消息长度
  const userMessages = assistantHistory.filter((item: { role: string }) => item.role === 'user');
  const totalUserChars = userMessages.reduce((sum: number, item: { content: string }) => {
    const content = item.content;
    if (content === '[图片]') return sum;
    return sum + content.length;
  }, 0);
  
  if (totalUserChars < 40) {
    setToastMessage('聊的太少啦，再多聊一点吧');
    setToastVisible(true);
    return;
  }
  
  generateDiary();
}, [generateDiary, assistantHistory]);
```

## 技术要点
- 使用 `assistantHistory` 而非 `messages`，因为 `assistantHistory` 已经按对话格式存储了历史
- 过滤 `[图片]` 占位符，因为图片不算文字内容
- 20 汉字 = 40 字符（UTF-16 编码下汉字占 2 个字符）

## 注意事项
- 需要安装依赖后进行真机或模拟器测试
- 确保测试场景：用户只发了图片、用户只说了几句话、用户说了足够多的话

## 后续任务
- [ ] 安装依赖 `npm install`
- [ ] 启动开发服务器 `npx expo start`
- [ ] 测试验证功能

---
**创建时间**: 2026-03-11 16:21
**创建者**: Claw (OpenClaw AI Assistant)