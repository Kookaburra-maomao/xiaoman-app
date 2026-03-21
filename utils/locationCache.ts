/**
 * 位置信息缓存工具
 * 缓存有效期：12小时
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@xiaoman_location_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12小时（毫秒）

export interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/**
 * 保存位置信息到缓存
 */
export const saveLocationCache = async (
  latitude: number,
  longitude: number
): Promise<void> => {
  try {
    const cacheData: CachedLocation = {
      latitude,
      longitude,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
    console.log('[LocationCache] 位置信息已缓存:', { latitude, longitude });
  } catch (error) {
    console.error('[LocationCache] 保存缓存失败:', error);
  }
};

/**
 * 获取缓存的位置信息
 * @returns 如果缓存有效则返回位置信息，否则返回 null
 */
export const getLocationCache = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    const cacheStr = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    
    if (!cacheStr) {
      console.log('[LocationCache] 无缓存数据');
      return null;
    }

    const cacheData: CachedLocation = JSON.parse(cacheStr);
    const now = Date.now();
    const age = now - cacheData.timestamp;

    // 检查缓存是否过期（12小时）
    if (age > CACHE_DURATION) {
      console.log('[LocationCache] 缓存已过期，年龄:', Math.floor(age / 1000 / 60), '分钟');
      await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }

    console.log('[LocationCache] 使用缓存位置，年龄:', Math.floor(age / 1000 / 60), '分钟');
    return {
      latitude: cacheData.latitude,
      longitude: cacheData.longitude,
    };
  } catch (error) {
    console.error('[LocationCache] 读取缓存失败:', error);
    return null;
  }
};

/**
 * 清除位置缓存
 */
export const clearLocationCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    console.log('[LocationCache] 缓存已清除');
  } catch (error) {
    console.error('[LocationCache] 清除缓存失败:', error);
  }
};
