import { Dimensions, Platform } from 'react-native';

const DESIGN_WIDTH = 375;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// iPad 缩放上限，防止元素过度放大（iPhone 全系列 < 1.3，不受影响）
const MAX_SCALE = 1.3;
const rawScale = SCREEN_WIDTH / DESIGN_WIDTH;
const SCALE = Math.min(rawScale, MAX_SCALE);

export const scaleSize = (size: number): number => {
  return size * SCALE;
};

const EFFECTIVE_WIDTH = DESIGN_WIDTH * SCALE;

export const wp = (percentage: number): number => {
  return (percentage * EFFECTIVE_WIDTH) / 100;
};

export const hp = (percentage: number): number => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

export const getScreenWidth = (): number => SCREEN_WIDTH;

export const getScreenHeight = (): number => SCREEN_HEIGHT;

export const isTablet = (): boolean => {
  return Platform.OS === 'ios' && SCREEN_WIDTH >= 768;
};

export const getContentMaxWidth = (): number => {
  return EFFECTIVE_WIDTH;
};

export const scaleFont = (size: number, factor: number = 1): number => {
  return scaleSize(size) * factor;
};
