# 优化 DatePicker 日期选择顺序和格式

## 任务时间
2026-03-22

## 需求描述
优化 DatePicker 组件的日期选择体验：
1. 将日期选择顺序改为：年 → 月 → 日（符合中文习惯）
2. 月份显示为中文格式：1月、2月、3月...12月
3. 日期显示为中文格式：1日、2日、3日...31日
4. 年份显示为中文格式：2024年、2025年、2026年

## 问题分析

### 原有实现的问题
- 使用 `@react-native-community/datetimepicker` 原生组件
- iOS 默认顺序为：月 → 日 → 年（美式习惯）
- 无法自定义显示格式和顺序
- 不符合中文用户的使用习惯

### 解决方案
- 创建自定义滚轮选择器
- 使用 FlatList 实现滚动效果
- 自定义显示格式和顺序
- 保持 Android 使用系统原生选择器

## 实施方案

### 1. 自定义滚轮选择器
**文件**: `components/plan/DatePicker.tsx`

**核心功能**：
- 使用 FlatList 实现三个独立的滚轮（年、月、日）
- 支持点击选择和滚动选择
- 自动滚动到当前选中项
- 添加选中指示器（上下边框线）

### 2. 数据生成函数

**年份列表**：
```typescript
function generateYears(currentYear: number): number[] {
  const years: number[] = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
}
```
- 当前年份前后各10年
- 共21年可选

**月份列表**：
```typescript
function generateMonths(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));
}
```
- 1月 ~ 12月
- 中文格式显示

**日期列表**：
```typescript
function generateDays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}
```
- 根据年月动态计算天数
- 自动处理大小月和闰年

### 3. FlatList 配置

**关键属性**：
```typescript
<FlatList
  ref={yearListRef}
  data={years}
  renderItem={renderYearItem}
  keyExtractor={(item) => item.toString()}
  showsVerticalScrollIndicator={false}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  snapToInterval={ITEM_HEIGHT}
  decelerationRate="fast"
  contentContainerStyle={styles.listContent}
/>
```

**性能优化**：
- `getItemLayout`：提前计算每项的位置和大小，提升滚动性能
- `snapToInterval`：滚动时自动对齐到项目
- `decelerationRate="fast"`：快速减速，提升滚动体验

### 4. 自动滚动到选中项

```typescript
useEffect(() => {
  if (visible) {
    setTimeout(() => {
      const years = generateYears(new Date().getFullYear());
      const yearIndex = years.findIndex((y) => y === year);
      if (yearIndex !== -1 && yearListRef.current) {
        yearListRef.current.scrollToIndex({ index: yearIndex, animated: false });
      }

      if (monthListRef.current) {
        monthListRef.current.scrollToIndex({ index: month - 1, animated: false });
      }

      if (dayListRef.current) {
        dayListRef.current.scrollToIndex({ index: day - 1, animated: false });
      }
    }, 100);
  }
}, [visible]);
```

### 5. 日期有效性检查

```typescript
useEffect(() => {
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    setDay(daysInMonth);
  }
}, [year, month]);
```
- 当年份或月份变化时，检查日期是否有效
- 例如：从1月31日切换到2月，自动调整为2月28日（或29日）

### 6. 选中指示器

```typescript
<View style={[
  styles.selectionIndicator,
  isDark && styles.selectionIndicatorDark
]} />
```
- 固定在中间位置
- 上下边框线标识选中区域
- 适配暗黑模式

## 样式设计

### 布局结构
```
┌─────────────────────────────┐
│  取消              确定      │ ← Header
├─────────────────────────────┤
│                             │
│  ┌─────┐ ┌─────┐ ┌─────┐  │
│  │2023年│ │ 1月 │ │ 1日 │  │
│  │2024年│ │ 2月 │ │ 2日 │  │
│  ├─────┤ ├─────┤ ├─────┤  │ ← 选中指示器
│  │2025年│ │ 3月 │ │ 3日 │  │
│  ├─────┤ ├─────┤ ├─────┤  │
│  │2026年│ │ 4月 │ │ 4日 │  │
│  │2027年│ │ 5月 │ │ 5日 │  │
│  └─────┘ └─────┘ └─────┘  │
│                             │
└─────────────────────────────┘
```

### 样式常量
```typescript
const ITEM_HEIGHT = 40; // 每项高度
```

### 选中状态样式
```typescript
pickerItemTextSelected: {
  fontSize: 20,
  color: Colors.light.text,
  fontWeight: '600',
}
```
- 选中项字体更大（20px）
- 字体加粗（600）
- 颜色更深

## 完成情况
- ✅ 创建自定义滚轮选择器
- ✅ 实现年-月-日顺序
- ✅ 月份显示为中文格式（1月、2月...）
- ✅ 日期显示为中文格式（1日、2日...）
- ✅ 年份显示为中文格式（2024年、2025年...）
- ✅ 使用 FlatList 实现滚动效果
- ✅ 添加选中指示器
- ✅ 自动滚动到选中项
- ✅ 日期有效性检查（大小月、闰年）
- ✅ 适配暗黑模式
- ✅ Android 保持使用系统原生选择器
- ✅ TypeScript 类型检查通过

## 相关文件
- `components/plan/DatePicker.tsx` - 日期选择器组件（重写）

## 使用位置
- `components/plan/PlanCreateModal.tsx` - 创建计划弹窗
- `components/plan/PlanEditModal.tsx` - 编辑计划弹窗

## 测试验证

### 测试场景

1. **基本选择**
   - 打开日期选择器
   - 验证顺序为：年 → 月 → 日
   - 验证格式为：2025年 3月 22日

2. **滚动选择**
   - 滚动年份列表
   - 验证滚动流畅，自动对齐
   - 验证选中项高亮显示

3. **点击选择**
   - 点击任意年份/月份/日期
   - 验证立即选中并高亮
   - 验证选中状态正确

4. **日期有效性**
   - 选择1月31日
   - 切换到2月
   - 验证自动调整为2月28日（或29日）

5. **闰年处理**
   - 选择2024年2月29日（闰年）
   - 切换到2025年
   - 验证自动调整为2月28日

6. **初始位置**
   - 打开选择器
   - 验证自动滚动到当前选中日期
   - 验证选中项在中间位置

7. **暗黑模式**
   - 切换到暗黑模式
   - 验证背景色、文字色、边框色正确
   - 验证选中指示器颜色正确

8. **Android 平台**
   - 在 Android 设备上测试
   - 验证使用系统原生选择器
   - 验证功能正常

### 测试步骤
1. 打开 app，进入计划页面
2. 点击"添加计划"或编辑计划
3. 点击日期选择按钮
4. 测试滚动和点击选择
5. 测试日期有效性
6. 测试暗黑模式适配
7. 在 Android 设备上测试

## 技术细节

### FlatList vs ScrollView
- **FlatList**：
  - 支持虚拟化，性能更好
  - 支持 `getItemLayout` 优化
  - 支持 `scrollToIndex` 精确滚动
  - 适合长列表

- **ScrollView**：
  - 简单直接
  - 不支持虚拟化
  - 性能较差
  - 适合短列表

### snapToInterval
- 滚动时自动对齐到项目
- 值为 `ITEM_HEIGHT`（40px）
- 配合 `decelerationRate="fast"` 使用
- 提供类似原生选择器的体验

### getItemLayout
```typescript
getItemLayout={(_, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
})}
```
- 提前计算每项的位置和大小
- 避免动态测量，提升性能
- 支持 `scrollToIndex` 精确滚动

### 日期计算
```typescript
const daysInMonth = new Date(year, month, 0).getDate();
```
- `new Date(year, month, 0)` 返回上个月的最后一天
- `.getDate()` 返回该月的天数
- 自动处理大小月和闰年

## 注意事项
1. Android 继续使用系统原生选择器，无需自定义
2. iOS 使用自定义选择器，提供更好的用户体验
3. 选中指示器使用 `pointerEvents='none'` 避免阻挡点击
4. 自动滚动使用 `setTimeout` 延迟执行，确保组件已渲染
5. 日期有效性检查在年份或月份变化时自动触发

## 后续优化建议
1. 添加滚动动画效果
2. 支持手势滑动选择
3. 添加haptic反馈（震动）
4. 优化滚动性能（使用 `Animated` API）
5. 支持自定义年份范围
6. 添加"今天"快捷按钮
7. 支持键盘输入日期
