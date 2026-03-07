# 添加用户反馈页面

## 任务时间
2026-03-07

## 任务目标
创建用户反馈页面，允许用户提交评分（0-10分）和反馈内容，提交后显示感谢提示并返回设置页面。

## 执行步骤

### 1. 创建反馈页面
**文件**: `app/feedback.tsx`

#### 1.1 页面结构
- 顶部导航栏：左侧返回按钮 + 中间标题"用户反馈"
- 评分区域：10个星星代表0-10分
- 反馈内容：多行文本输入框
- 底部悬浮提交按钮

#### 1.2 功能实现
```typescript
// 状态管理
const [score, setScore] = useState(10); // 默认10分
const [content, setContent] = useState('');
const [submitting, setSubmitting] = useState(false);

// 提交反馈
const handleSubmit = async () => {
  if (!content.trim()) {
    Alert.alert('提示', '请输入反馈内容');
    return;
  }

  const response = await fetch(`${apiUrl}/api/feedbacks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: user?.id,
      content: content.trim(),
      score: score,
    }),
  });

  if (response.ok) {
    Alert.alert('提示', '感谢您的反馈~', [
      {
        text: '确定',
        onPress: () => router.back(),
      },
    ]);
  }
};
```

### 2. 修改设置页面
**文件**: `app/settings.tsx`

添加点击事件跳转到反馈页面：

```typescript
<TouchableOpacity 
  style={styles.settingItem} 
  activeOpacity={0.7}
  onPress={() => router.push('/feedback')}
>
```

## 完成情况

- ✅ 创建反馈页面 `app/feedback.tsx`
- ✅ 顶部导航栏（返回按钮 + 标题）
- ✅ 返回按钮使用指定图标（40x40px）
- ✅ 评分功能（10个星星，0-10分）
- ✅ 反馈内容输入框（多行，最多1000字）
- ✅ 字数统计显示
- ✅ 底部悬浮提交按钮
- ✅ 提交时显示 loading 状态
- ✅ 提交成功显示感谢提示
- ✅ 提示后自动返回设置页面
- ✅ 设置页面添加跳转逻辑
- ✅ 键盘自适应处理

## 相关文件

### 新增的文件
- `app/feedback.tsx` - 用户反馈页面

### 修改的文件
- `app/settings.tsx` - 添加跳转到反馈页面的逻辑

## 技术要点

### 1. 评分星星组件
使用循环渲染10个星星，根据当前评分高亮显示：

```typescript
<View style={styles.starsContainer}>
  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
    <TouchableOpacity
      key={star}
      onPress={() => setScore(star)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.starText,
        star <= score && styles.starTextActive
      ]}>
        ★
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

样式：
- 未选中：灰色 `#D0D0D0`
- 已选中：金色 `#FFD700`

### 2. 多行输入框
```typescript
<TextInput
  style={styles.textInput}
  placeholder="请输入您的反馈内容..."
  multiline
  numberOfLines={8}
  textAlignVertical="top"
  value={content}
  onChangeText={setContent}
  maxLength={1000}
/>
```

特性：
- 多行输入
- 最多1000字
- 显示字数统计
- 顶部对齐

### 3. 键盘自适应
使用 `KeyboardAvoidingView` 处理键盘弹出：

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={styles.keyboardView}
>
```

### 4. 提交按钮悬浮
```typescript
submitContainer: {
  padding: scaleSize(20),
  paddingBottom: scaleSize(30),
  backgroundColor: Colors.light.background,
  borderTopWidth: scaleSize(1),
  borderTopColor: '#E5E5E5',
}
```

### 5. 提交流程
1. 验证内容不为空
2. 显示 loading 状态
3. 调用 API 提交
4. 成功后显示感谢提示
5. 点击确定后返回设置页面

### 6. 错误处理
```typescript
try {
  // 提交逻辑
} catch (error: any) {
  console.error('提交反馈失败:', error);
  Alert.alert('错误', error.message || '提交失败，请重试');
} finally {
  setSubmitting(false);
}
```

## API 接口

### 提交反馈
- **接口**: `POST /api/feedbacks`
- **参数**:
  ```json
  {
    "user_id": "用户ID（可选）",
    "content": "反馈内容（必填）",
    "score": 10
  }
  ```
- **响应**:
  ```json
  {
    "code": 200,
    "message": "操作成功",
    "data": {
      "id": "反馈ID",
      "gmt_create": "创建时间"
    }
  }
  ```

## 页面截图说明

### 顶部导航栏
```
[返回图标]    用户反馈    [空白]
```

### 评分区域
```
评分
★ ★ ★ ★ ★ ★ ★ ★ ★ ★
10 分
```

### 反馈内容
```
反馈内容
┌─────────────────────────┐
│ 请输入您的反馈内容...    │
│                         │
│                         │
│                         │
│                         │
└─────────────────────────┘
0/1000
```

### 提交按钮
```
┌─────────────────────────┐
│         提交            │
└─────────────────────────┘
```

## 样式规范

### 返回按钮
- 尺寸：40x40px
- 图标：24x24px
- 位置：左上角

### 星星评分
- 星星尺寸：36x36px
- 字体大小：32px
- 间距：8px
- 未选中颜色：#D0D0D0
- 选中颜色：#FFD700

### 输入框
- 背景色：白色
- 圆角：12px
- 内边距：16px
- 最小高度：200px
- 边框：1px #E5E5E5

### 提交按钮
- 高度：50px
- 圆角：12px
- 背景色：主题色
- 文字颜色：白色
- 字体大小：16px
- 字重：600

## 用户体验优化

### 1. 默认评分
默认评分为10分，用户可以直接提交或修改评分。

### 2. 字数统计
实时显示已输入字数和最大字数限制。

### 3. 提交状态
提交时按钮显示 loading 状态，防止重复提交。

### 4. 友好提示
- 内容为空时提示用户
- 提交成功显示感谢信息
- 提交失败显示错误信息

### 5. 键盘处理
- 键盘弹出时自动调整布局
- 输入框不被键盘遮挡
- 支持点击空白区域收起键盘

## 测试建议

### 功能测试
1. 点击设置页面"使用反馈"跳转到反馈页面
2. 点击返回按钮返回设置页面
3. 点击星星修改评分
4. 输入反馈内容
5. 测试字数限制（1000字）
6. 提交空内容（应该提示）
7. 提交正常反馈（应该成功）
8. 验证提交后显示感谢提示
9. 验证点击确定后返回设置页面

### 边界测试
1. 输入超长内容（应该被限制）
2. 输入特殊字符和 emoji
3. 快速点击提交按钮（应该防止重复提交）
4. 网络异常时提交（应该显示错误）

### UI 测试
1. 不同屏幕尺寸下的显示
2. 键盘弹出时的布局
3. 星星点击的视觉反馈
4. 提交按钮的 loading 状态

## 注意事项

1. **用户ID**: 如果用户未登录，`user_id` 为空，支持匿名反馈
2. **内容验证**: 前端验证内容不为空，后端也需要验证
3. **评分范围**: 1-10分，前端限制选择范围
4. **字数限制**: 最多1000字，使用 `maxLength` 限制
5. **网络错误**: 需要处理网络请求失败的情况
6. **键盘遮挡**: 使用 `KeyboardAvoidingView` 避免键盘遮挡输入框

## 后续优化建议

### 1. 添加反馈类型
```typescript
const FEEDBACK_TYPES = [
  { value: 'feature', label: '功能建议' },
  { value: 'bug', label: 'Bug 反馈' },
  { value: 'complaint', label: '投诉' },
  { value: 'other', label: '其他' },
];
```

### 2. 添加图片上传
允许用户上传截图或照片作为反馈的补充。

### 3. 添加联系方式
可选填写联系方式，方便后续跟进。

### 4. 添加历史反馈
显示用户之前提交的反馈和处理状态。

### 5. 添加快捷反馈
提供常见问题的快捷反馈选项。

### 6. 添加反馈统计
显示反馈提交成功的统计信息。

## 相关文档
- [AI 协作约定](../../AI_CONVENTIONS.md)
- [服务端反馈接口文档](../../../server/docs/api/API_FEEDBACKS.md)
