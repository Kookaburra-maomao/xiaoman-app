# 修复 DatePicker 暗黑模式显示问题

## 任务时间
2026-03-22

## 问题描述
DatePicker 组件在暗黑模式下显示异常：
- 背景色固定为白色，在暗黑模式下刺眼
- 边框颜色固定为浅色，对比度不足
- 文字颜色不适配暗黑模式
- DateTimePicker 内部组件未设置主题

## 问题原因
DatePicker 组件使用了硬编码的颜色值，没有根据系统主题动态调整：
- `backgroundColor: '#FFFFFF'` - 固定白色背景
- `borderBottomColor: '#E5E5E5'` - 固定浅色边框
- `color: Colors.light.text` - 固定浅色文字
- DateTimePicker 未设置 `themeVariant` 属性

## 解决方案

### 1. 使用 Appearance API
**文件**: `components/plan/DatePicker.tsx`

**修改内容**：
- 导入 `Appearance` 从 `react-native`
- 使用 `Appearance.getColorScheme()` 获取当前主题模式
- 使用 `Appearance.addChangeListener` 监听主题变化
- 根据主题模式动态应用样式

**关键代码**：
```typescript
import { Appearance } from 'react-native';

export default function DatePicker({ visible, selectedDate, onConfirm, onCancel, minDate }: DatePickerProps) {
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  // 监听主题变化
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const isDark = colorScheme === 'dark';
  
  // ...
}
```

### 2. 添加暗黑模式样式
**样式定义**：
```typescript
const styles = StyleSheet.create({
  // 浅色模式样式
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  // 暗黑模式样式
  datePickerContainerDark: {
    backgroundColor: '#1C1C1E', // iOS 暗黑模式标准背景色
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  datePickerHeaderDark: {
    borderBottomColor: '#38383A', // iOS 暗黑模式标准边框色
  },
  datePickerCancelText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  datePickerCancelTextDark: {
    color: '#FFFFFF', // 暗黑模式文字颜色
  },
});
```

### 3. 动态应用样式
**JSX 修改**：
```typescript
<View style={[
  styles.datePickerContainer,
  isDark && styles.datePickerContainerDark
]}>
  <View style={[
    styles.datePickerHeader,
    isDark && styles.datePickerHeaderDark
  ]}>
    <TouchableOpacity onPress={onCancel} style={styles.datePickerButton}>
      <Text style={[
        styles.datePickerCancelText,
        isDark && styles.datePickerCancelTextDark
      ]}>取消</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={handleConfirm} style={styles.datePickerButton}>
      <Text style={styles.datePickerButtonText}>确定</Text>
    </TouchableOpacity>
  </View>
  <DateTimePicker
    value={value}
    mode="date"
    display="spinner"
    onChange={(_, date) => date && setValue(date)}
    style={styles.picker}
    minimumDate={minDate}
    themeVariant={isDark ? 'dark' : 'light'} // 设置 DateTimePicker 的主题
  />
</View>
```

### 4. 设置 DateTimePicker 主题
**关键属性**：
```typescript
<DateTimePicker
  themeVariant={isDark ? 'dark' : 'light'}
  // ... 其他属性
/>
```

## 颜色规范

### iOS 暗黑模式标准颜色
- **背景色**：`#1C1C1E` - System Background (Dark)
- **边框色**：`#38383A` - Separator (Dark)
- **文字色**：`#FFFFFF` - Label (Dark)

### 浅色模式颜色
- **背景色**：`#FFFFFF` - System Background (Light)
- **边框色**：`#E5E5E5` - Separator (Light)
- **文字色**：`Colors.light.text` - Label (Light)

## 完成情况
- ✅ 导入 `Appearance` API
- ✅ 使用 `Appearance.getColorScheme()` 获取主题
- ✅ 使用 `Appearance.addChangeListener()` 监听主题变化
- ✅ 添加暗黑模式样式定义
- ✅ 动态应用容器背景色
- ✅ 动态应用边框颜色
- ✅ 动态应用文字颜色
- ✅ 设置 DateTimePicker 的 `themeVariant` 属性
- ✅ TypeScript 类型检查通过
- ✅ 修复 `useColorScheme` 不存在的错误

## 相关文件
- `components/plan/DatePicker.tsx` - 日期选择器组件（修改）

## 使用位置
- `components/plan/PlanCreateModal.tsx` - 创建计划弹窗
- `components/plan/PlanEditModal.tsx` - 编辑计划弹窗

## 测试验证

### 测试场景
1. **浅色模式**
   - 系统设置：浅色模式
   - 打开日期选择器
   - 验证背景为白色
   - 验证边框为浅灰色
   - 验证文字清晰可读

2. **暗黑模式**
   - 系统设置：暗黑模式
   - 打开日期选择器
   - 验证背景为深色（#1C1C1E）
   - 验证边框为深灰色（#38383A）
   - 验证文字为白色，清晰可读
   - 验证 DateTimePicker 滚轮为暗黑主题

3. **动态切换**
   - 在 app 运行时切换系统主题
   - 打开日期选择器
   - 验证样式自动适配新主题

### 测试步骤
1. 打开 app，进入计划页面
2. 点击"添加计划"或编辑计划
3. 点击日期选择按钮
4. 观察日期选择器的显示效果
5. 切换系统主题（浅色/暗黑）
6. 重复步骤 3-4，验证主题适配

## 技术细节

### Appearance API
- React Native 内置 API
- `Appearance.getColorScheme()` 返回当前系统主题：`'light' | 'dark' | null`
- `Appearance.addChangeListener()` 监听系统主题变化
- 需要手动管理订阅和取消订阅
- 兼容性更好，适用于所有 React Native 版本

**为什么使用 Appearance 而不是 useColorScheme？**
- `useColorScheme` 在某些 React Native 版本中不可用
- `Appearance` API 更稳定，兼容性更好
- 可以手动控制主题状态更新

### DateTimePicker themeVariant
- `@react-native-community/datetimepicker` 提供的属性
- 可选值：`'light' | 'dark'`
- 控制 iOS 原生日期选择器的主题
- 影响滚轮颜色、文字颜色等

### 样式合并
```typescript
style={[
  styles.baseStyle,
  condition && styles.conditionalStyle
]}
```
- 使用数组合并多个样式
- 后面的样式会覆盖前面的同名属性
- `condition && styles.conditionalStyle` 实现条件样式

## 注意事项
1. Android 使用系统原生日期选择对话框，自动适配主题，无需额外处理
2. iOS 使用自定义 Modal + DateTimePicker，需要手动适配主题
3. 颜色值参考 iOS Human Interface Guidelines 的暗黑模式规范
4. `themeVariant` 属性仅在 iOS 上生效

## 后续优化建议
1. 将暗黑模式颜色定义到 `constants/theme.ts` 中统一管理
2. 创建通用的暗黑模式样式工具函数
3. 检查其他组件是否也存在暗黑模式适配问题
4. 考虑添加主题切换动画效果
