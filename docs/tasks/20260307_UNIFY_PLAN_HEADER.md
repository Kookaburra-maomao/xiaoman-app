# 统一计划页面头部样式

## 任务时间
2026-03-07

## 任务目标
让 `plan.tsx` 使用 `chat.tsx` 的 `ChatHeader` 组件，统一样式和行为。标题显示"计划"，不展示运营卡片按钮。

## 执行步骤

### 1. 修改 ChatHeader 组件
**文件**: `components/chat/ChatHeader.tsx`

添加 `hideCardButton` 可选属性，用于控制是否显示运营卡片切换按钮：

```typescript
interface ChatHeaderProps {
  title?: string;
  showCard: boolean;
  onToggleCard: () => void;
  onShowMenu: () => void;
  isStreaming?: boolean;
  hideCardButton?: boolean; // 新增：是否隐藏运营卡片按钮
}
```

在渲染时根据 `hideCardButton` 条件渲染中间按钮：

```typescript
{/* 中间：方向切换按钮（可选） */}
{!hideCardButton && (
  <TouchableOpacity
    style={styles.headerCenter}
    onPress={handleToggleCard}
    activeOpacity={0.7}
  >
    <Image
      source={{ uri: showCard ? HEADER_UP_ICON_URL : HEADER_DOWN_ICON_URL }}
      style={[styles.headerIcon, isStreaming && styles.headerIconDisabled]}
      resizeMode="contain"
    />
  </TouchableOpacity>
)}
```

### 2. 修改 plan.tsx
**文件**: `app/(tabs)/plan.tsx`

#### 2.1 更新导入
```typescript
import ChatHeader from '@/components/chat/ChatHeader';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
```

移除不再需要的导入：
- `WEEKDAYS` from '@/constants/plan'
- `useMemo` from 'react'

#### 2.2 添加 header 高度计算
```typescript
// 获取安全区域边距，用于计算header高度
const insets = useSafeAreaInsets();
const headerHeight = insets.top + scaleSize(16) + scaleSize(24) + scaleSize(14) + scaleSize(20);
```

#### 2.3 移除旧的日期格式化逻辑
删除 `currentDateInfo` 的 `useMemo` 计算，因为 `ChatHeader` 内部已经处理日期显示。

#### 2.4 替换 header 渲染
将原有的自定义 header 替换为 `ChatHeader` 组件：

```typescript
<ChatHeader
  title="计划"
  showCard={false}
  onToggleCard={() => {}}
  onShowMenu={handleGoToSettings}
  hideCardButton={true} // 隐藏运营卡片按钮
/>
```

#### 2.5 更新内容区域的 paddingTop
```typescript
<ScrollView 
  style={styles.scrollView} 
  contentContainerStyle={[styles.scrollViewContent, { paddingTop: headerHeight }]}
>
```

```typescript
<View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
```

#### 2.6 移除旧的 header 样式
删除以下样式定义：
- `header`
- `headerLeft`
- `headerTitle`
- `headerDate`
- `headerRight`

从 `scrollViewContent` 中移除 `paddingTop: scaleSize(16)`，改为动态设置。

## 完成情况

- ✅ ChatHeader 组件支持隐藏运营卡片按钮
- ✅ plan.tsx 使用 ChatHeader 组件
- ✅ 标题显示"计划"
- ✅ 不展示运营卡片按钮
- ✅ 日期和星期自动显示（由 ChatHeader 处理）
- ✅ 统一样式和行为
- ✅ TypeScript 编译通过

## 相关文件

### 修改的文件
- `components/chat/ChatHeader.tsx` - 添加 hideCardButton 属性
- `app/(tabs)/plan.tsx` - 使用 ChatHeader 组件

### 受益的页面
- `app/(tabs)/chat.tsx` - 对话页面（原有功能不变）
- `app/(tabs)/plan.tsx` - 计划页面（统一样式）

## 技术要点

### 1. 组件复用
通过添加可选属性 `hideCardButton`，让 `ChatHeader` 组件可以在不同场景下使用：
- 对话页面：显示运营卡片切换按钮
- 计划页面：隐藏运营卡片切换按钮

### 2. 动态高度计算
使用 `useSafeAreaInsets` 获取安全区域边距，计算 header 的实际高度，确保内容区域正确定位：

```typescript
const headerHeight = insets.top + scaleSize(16) + scaleSize(24) + scaleSize(14) + scaleSize(20);
```

这个高度包括：
- `insets.top` - 顶部安全区域（刘海屏等）
- `scaleSize(16)` - paddingTop
- `scaleSize(24)` - 标题高度
- `scaleSize(14)` - 日期高度
- `scaleSize(20)` - paddingBottom

### 3. 条件渲染
使用 `{!hideCardButton && (...)}` 实现按钮的条件渲染，保持组件结构清晰。

## 样式对比

### 修改前（plan.tsx 自定义 header）
```typescript
<View style={styles.header}>
  <View style={styles.headerLeft}>
    <Text style={styles.headerTitle}>计划</Text>
    <Text style={styles.headerDate}>
      {currentDateInfo.date} · {currentDateInfo.weekday}
    </Text>
  </View>
  <TouchableOpacity onPress={handleGoToSettings}>
    <Ionicons name="menu" size={24} />
  </TouchableOpacity>
</View>
```

### 修改后（使用 ChatHeader）
```typescript
<ChatHeader
  title="计划"
  showCard={false}
  onToggleCard={() => {}}
  onShowMenu={handleGoToSettings}
  hideCardButton={true}
/>
```

## 优势

1. **代码复用** - 减少重复代码，统一维护
2. **样式一致** - 确保对话页和计划页的 header 样式完全一致
3. **易于维护** - 修改 header 样式只需修改一个组件
4. **灵活性** - 通过属性控制不同场景的显示需求
5. **类型安全** - TypeScript 确保属性使用正确

## 后续优化建议

### 1. 其他页面统一
可以考虑让其他页面（如记录页面）也使用 `ChatHeader` 组件，进一步统一样式。

### 2. 主题支持
如果未来需要支持深色模式，只需在 `ChatHeader` 中添加主题支持即可。

### 3. 动画效果
可以为 header 添加滚动时的动画效果（如渐变、缩放等）。

## 注意事项

1. `hideCardButton` 为 `true` 时，中间区域不会渲染任何内容
2. 必须正确计算 `headerHeight`，否则内容会被 header 遮挡
3. `StatusBar` 样式已从 `hidden` 改为 `style="dark"`，与对话页保持一致

## 相关文档
- [AI 协作约定](../../AI_CONVENTIONS.md)
- [会话延续文档](20260307_SESSION_CONTINUATION.md)
