/**
 * 禁用全局字体缩放
 * 防止系统字体大小设置影响 app 布局
 */

import { Text, TextInput } from 'react-native';

/**
 * 禁用字体缩放
 * 必须在 app 启动时立即调用
 */
export const disableFontScaling = () => {
  console.log('[DisableFontScaling] 开始禁用字体缩放...');

  // 全局禁用 Text 组件的字体缩放
  // @ts-ignore - Text.defaultProps 在 React Native 中存在但 TypeScript 类型定义中没有
  Text.defaultProps = {
    // @ts-ignore
    ...Text.defaultProps,
    allowFontScaling: false,
  };

  // 全局禁用 TextInput 组件的字体缩放
  // @ts-ignore - TextInput.defaultProps 在 React Native 中存在但 TypeScript 类型定义中没有
  TextInput.defaultProps = {
    // @ts-ignore
    ...TextInput.defaultProps,
    allowFontScaling: false,
  };

  console.log('[DisableFontScaling] 字体缩放已禁用');
};
