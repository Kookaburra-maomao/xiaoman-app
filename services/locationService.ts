/**
 * 位置和天气服务
 */

import { getLocationCache, saveLocationCache } from '@/utils/locationCache';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 获取用户当前经纬度（带缓存）
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    // 动态导入 expo-location，如果未安装则返回 null
    const Location = await import('expo-location').catch(() => null);
    
    if (!Location) {
      console.log('[Location] expo-location 未安装，尝试使用缓存');
      return await getLocationCache();
    }

    // 请求位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('[Location] 位置权限未授予，尝试使用缓存');
      return await getLocationCache();
    }

    // 获取当前位置，设置1秒超时
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log('[Location] 获取位置超时（1秒）');
        resolve(null);
      }, 1000);
    });

    const location = await Promise.race([locationPromise, timeoutPromise]);

    if (!location) {
      console.log('[Location] 获取位置失败，尝试使用缓存');
      return await getLocationCache();
    }

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // 保存到缓存
    await saveLocationCache(coords.latitude, coords.longitude);

    return coords;
  } catch (error) {
    console.log('[Location] 位置服务异常，尝试使用缓存');
    return await getLocationCache();
  }
};

// 获取用户当前位置和天气信息（带缓存）
export const getLocationAndWeather = async (): Promise<{
  city: string;
  weather: string;
}> => {
  try {
    // 动态导入 expo-location，如果未安装则尝试使用缓存
    const Location = await import('expo-location').catch(() => null);
    
    if (!Location) {
      console.log('[LocationWeather] expo-location 未安装，尝试使用缓存');
      const cachedLocation = await getLocationCache();
      if (cachedLocation) {
        return await fetchWeatherByCoords(cachedLocation.latitude, cachedLocation.longitude);
      }
      return { city: '', weather: '' };
    }

    // 1. 请求位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('[LocationWeather] 位置权限未授予，尝试使用缓存');
      const cachedLocation = await getLocationCache();
      if (cachedLocation) {
        return await fetchWeatherByCoords(cachedLocation.latitude, cachedLocation.longitude);
      }
      return { city: '', weather: '' };
    }

    // 2. 获取当前位置，设置3秒超时
    const locationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.log('[LocationWeather] 获取位置超时（3秒）');
        resolve(null);
      }, 3000);
    });

    const location = await Promise.race([locationPromise, timeoutPromise]);

    if (!location) {
      console.log('[LocationWeather] 获取位置失败，尝试使用缓存');
      const cachedLocation = await getLocationCache();
      if (cachedLocation) {
        return await fetchWeatherByCoords(cachedLocation.latitude, cachedLocation.longitude);
      }
      return { city: '', weather: '' };
    }

    const { latitude, longitude } = location.coords;

    // 保存到缓存
    await saveLocationCache(latitude, longitude);

    // 3. 获取天气信息
    return await fetchWeatherByCoords(latitude, longitude);
  } catch (error) {
    console.log('[LocationWeather] 位置和天气服务异常，尝试使用缓存');
    const cachedLocation = await getLocationCache();
    if (cachedLocation) {
      return await fetchWeatherByCoords(cachedLocation.latitude, cachedLocation.longitude);
    }
    return { city: '', weather: '' };
  }
};

// 根据经纬度获取天气信息（内部辅助函数）
const fetchWeatherByCoords = async (
  latitude: number,
  longitude: number
): Promise<{ city: string; weather: string }> => {
  try {
    const response = await fetch(`${apiUrl}/api/weather/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
      }),
    });

    if (!response.ok) {
      console.log('[LocationWeather] 获取天气信息失败');
      return { city: '', weather: '' };
    }

    const result = await response.json();

    if (result.code === 200 && result.data) {
      return {
        city: result.data.city || '',
        weather: result.data.weather || '',
      };
    }

    return { city: '', weather: '' };
  } catch (error) {
    console.log('[LocationWeather] 获取天气信息异常');
    return { city: '', weather: '' };
  }
};
