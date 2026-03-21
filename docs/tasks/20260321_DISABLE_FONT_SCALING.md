# 禁用系统字体缩放

## 任务时间
2026-03-21

## 问题描述
当用户在系统设置中启用大号字体时，app 的 UI 会出现错乱，布局被破坏。

## 问题原因
React Native 默认会响应系统的字体缩放设置（Accessibility - Text Size），导致：
- 文字大小超出预期
- 布局容器被撑开
- UI 元素重叠或错位
- 固定尺寸的组件无法容纳放大的文字

## 解决方案（推荐）

### 修改全局 defaultProps
在 app 根布局文件中，在所有组件渲染之前，修改 Text 和 TextInput 的默认属性。

**优点**：
- 一劳永逸，只需修改一处
- 影响整个 app 的所有文字组件
- 包括第三方库中的 Text 组件
- 代码简洁，易于维护

**原理**：
通过修改 `Text.defaultProps` 和 `TextInput.defaultProps`，让所有新创建的组件自动继承 `allowFontScaling: false` 属性。

## 实施步骤

### 1. 创建工具函数
**文件**: `utils/disableFontScaling.ts`

```typescript
import { Text, TextInput } from 'react-native';

export const disableFontScaling = () => {
  console.log('[DisableFontScaling] 开始禁用字体缩放...');

  // 全局禁用 Text 组件的字体缩放
  // @ts-ignore
  Text.defaultProps = {
    // @ts-ignore
    ...Text.defaultProps,
    allowFontScaling: false,
  };

  // 全局禁用 TextInput 组件的字体缩放
  // @ts-ignore
  TextInput.defaultProps = {
    // @ts-ignore
    ...TextInput.defaultProps,
    allowFontScaling: false,
  };

  console.log('[DisableFontScaling] 字体缩放已禁用');
};
```

**关键点**：
- 使用扩展运算符 `...Text.defaultProps` 保留原有属性
- 只设置 `allowFontScaling: false`，简单有效
- 这个方法会影响整个 app 的所有 Text 和 TextInput 组件

### 2. 在根布局中调用
**文件**: `app/_layout.tsx`

```typescript
import { disableFontScaling } from '@/utils/disableFontScaling';

// 禁用全局字体缩放，防止系统字体设置影响 app 布局
disableFontScaling();
```

## 完成情况
- ✅ 创建 `utils/disableFontScaling.ts` 工具函数
- ✅ 使用扩展运算符保留原有 defaultProps
- ✅ 在根布局中调用工具函数
- ✅ 添加 TypeScript 类型忽略注解
- ✅ 添加日志输出
- ✅ TypeScript 类型检查通过
- ⏳ 等待用户测试验证

## 测试说明
由于项目使用了自定义 TabBar 组件，所有的 Text 组件都会自动继承全局 defaultProps 设置，无需额外配置导航栏。

**测试步骤**：
1. 清除缓存：`npx expo start -c`
2. 在 iOS 设置中调整字体大小到最大
3. 打开 app，检查各个页面的布局
4. 查看控制台日志确认函数已执行

## 相关文件
- `utils/disableFontScaling.ts` - 禁用字体缩放工具（新建）
- `app/_layout.tsx` - 根布局文件（修改）

## 技术细节

### defaultProps 方法
```typescript
// 使用扩展运算符保留原有属性
Text.defaultProps = {
  ...Text.defaultProps,
  allowFontScaling: false,
};

TextInput.defaultProps = {
  ...TextInput.defaultProps,
  allowFontScaling: false,
};
```

**工作原理**：
1. React Native 的 Text 和 TextInput 组件支持 `defaultProps`
2. 所有新创建的组件实例会自动继承这些默认属性
3. 除非组件显式设置 `allowFontScaling={true}`，否则都会使用默认值 `false`

**为什么使用扩展运算符**：
- 保留 `defaultProps` 中可能存在的其他属性
- 避免覆盖掉原有的配置
- 更安全的修改方式

### 执行时机
- 必须在 app 启动时立即执行
- 必须在任何组件渲染之前
- 在根布局文件的顶部（import 之后，组件定义之前）

### 影响范围
- 所有 `<Text>` 组件
- 所有 `<TextInput>` 组件
- 第三方库中使用的 Text/TextInput 组件
- 自定义组件中的 Text/TextInput 组件

## 测试验证

### 测试场景
1. **默认字体大小**
   - 系统设置：默认
   - 验证：app 显示正常

2. **大号字体**
   - 系统设置：最大字体
   - 验证：app 字体大小不变，布局正常

3. **小号字体**
   - 系统设置：最小字体
   - 验证：app 字体大小不变，布局正常

4. **动态切换**
   - 在 app 运行时切换系统字体大小
   - 验证：app 不受影响（可能需要重启 app）

### 测试步骤

#### iOS 测试
1. 打开"设置" > "辅助功能" > "显示与文字大小" > "更大字体"
2. 调整字体大小滑块到最大
3. 打开 app，验证布局正常
4. 检查各个页面：登录、聊天、记录、计划、设置
5. 验证文字大小保持一致

#### Android 测试
1. 打开"设置" > "显示" > "字体大小"
2. 调整字体大小到最大
3. 打开 app，验证布局正常
4. 检查各个页面：登录、聊天、记录、计划、设置
5. 验证文字大小保持一致

### 验证方法
- 对比系统字体设置前后的截图
- 检查是否有文字溢出或被截断
- 验证按钮、输入框等组件的尺寸
- 确认布局没有错位或重叠
- 查看控制台日志确认函数已执行

## 优缺点分析

### 优点
1. **布局稳定**：UI 不会因系统设置而错乱
2. **设计一致**：所有用户看到的界面完全一致
3. **实现简单**：只需调用一个函数
4. **性能无影响**：不增加额外开销
5. **更彻底**：组合两种方法，确保完全禁用

### 缺点
1. **无障碍性降低**：视力不佳的用户无法放大文字
2. **用户体验**：无法满足部分用户的个性化需求
3. **违背系统规范**：iOS/Android 建议尊重系统设置

## 故障排查

### 如果字体缩放仍然生效

1. **检查函数是否执行**
   - 查看控制台是否有以下日志：
     ```
     [DisableFontScaling] 开始禁用字体缩放...
     [DisableFontScaling] 字体缩放已禁用
     ```
   - 如果没有，检查导入路径是否正确

2. **检查执行顺序**
   - 确保 `disableFontScaling()` 在所有组件渲染之前执行
   - 应该在 `_layout.tsx` 的顶部调用（在组件定义之前）

3. **清除缓存重启**
   ```bash
   # 清除缓存并重启
   npx expo start -c
   ```

4. **检查是否有组件显式设置了 allowFontScaling**
   ```typescript
   // 这会覆盖全局设置
   <Text allowFontScaling={true}>文本</Text>
   ```
   使用搜索工具查找：`allowFontScaling.*true`

5. **使用开发构建测试**
   - Expo Go 可能有限制或缓存问题
   - 使用开发构建测试：
     ```bash
     # iOS
     npx expo run:ios
     
     # Android
     npx expo run:android
     ```

6. **验证 defaultProps 是否生效**
   - 在代码中添加调试日志：
     ```typescript
     console.log('Text.defaultProps:', Text.defaultProps);
     console.log('TextInput.defaultProps:', TextInput.defaultProps);
     ```

## 相关文档
- [React Native Text 文档](https://reactnative.dev/docs/text#allowfontscaling)
- [React Native TextInput 文档](https://reactnative.dev/docs/textinput#allowfontscaling)
- [iOS 无障碍指南](https://developer.apple.com/accessibility/)
- [Android 无障碍指南](https://developer.android.com/guide/topics/ui/accessibility)
- [AI 协作约定](../../AI_CONVENTIONS.md)

## 后续优化建议

1. **如果当前方案不生效，考虑以下替代方案**
   - 创建自定义 Text/TextInput 组件包装器
   - 使用 babel 插件自动添加 allowFontScaling={false}
   - 在每个组件中手动设置 allowFontScaling={false}

2. **监控用户反馈**
   - 收集关于字体大小的反馈
   - 评估是否需要提供自定义字体设置

3. **无障碍功能**
   - 添加高对比度模式
   - 提供语音朗读支持
   - 优化触摸目标大小

4. **响应式设计**
   - 逐步改进布局，支持有限的字体缩放
   - 使用 `maxFontSizeMultiplier` 限制范围（如 1.2）
   - 测试各种设备和字体大小

5. **用户设置**
   - 在 app 内提供字体大小选项
   - 独立于系统设置
   - 给用户更多控制权

