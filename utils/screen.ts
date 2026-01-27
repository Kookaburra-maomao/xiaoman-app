import { Dimensions } from 'react-native';

// 设计稿宽度（根据你的设计稿）
const DESIGN_WIDTH = 375;

// 获取屏幕宽度和高度
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 根据设计稿宽度进行自适应（水平方向）
 * @param size 设计稿上的尺寸
 * @returns 实际屏幕上的尺寸
 */
export const scaleSize = (size: number): number => {
  return (size / DESIGN_WIDTH) * SCREEN_WIDTH;
};

/**
 * 根据屏幕宽度百分比计算尺寸
 * @param percentage 百分比（0-100）
 * @returns 实际屏幕上的尺寸
 */
export const wp = (percentage: number): number => {
  return (percentage * SCREEN_WIDTH) / 100;
};

/**
 * 根据屏幕高度百分比计算尺寸
 * @param percentage 百分比（0-100）
 * @returns 实际屏幕上的尺寸
 */
export const hp = (percentage: number): number => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

/**
 * 获取屏幕宽度
 */
export const getScreenWidth = (): number => {
  return SCREEN_WIDTH;
};

/**
 * 获取屏幕高度
 */
export const getScreenHeight = (): number => {
  return SCREEN_HEIGHT;
};

/**
 * 字体大小缩放（可选：字体通常使用较小的缩放比例）
 * @param size 设计稿上的字体大小
 * @param factor 缩放因子，默认1（不缩放），可以设置为0.9等
 * @returns 实际屏幕上的字体大小
 */
export const scaleFont = (size: number, factor: number = 1): number => {
  return scaleSize(size) * factor;
};
