/**
 * 位置和天气服务
 */

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 获取用户当前经纬度
export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  try {
    // 动态导入 expo-location，如果未安装则返回 null
    const Location = await import('expo-location').catch(() => null);
    
    if (!Location) {
      console.log('expo-location 未安装');
      return null;
    }

    // 请求位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('位置权限未授予');
      return null;
    }

    // 获取当前位置
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('获取位置失败:', error);
    return null;
  }
};

// 获取用户当前位置和天气信息
export const getLocationAndWeather = async (): Promise<{
  city: string;
  weather: string;
}> => {
  try {
    // 动态导入 expo-location，如果未安装则返回空值
    const Location = await import('expo-location').catch(() => null);
    
    if (!Location) {
      console.log('expo-location 未安装，使用默认值');
      return {
        city: '',
        weather: '',
      };
    }

    // 1. 请求位置权限
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('位置权限未授予，使用默认值');
      return {
        city: '',
        weather: '',
      };
    }

    // 2. 获取当前位置
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // 3. 调用后端接口获取城市和天气信息
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
      console.log('获取天气信息失败');
      return {
        city: '',
        weather: '',
      };
    }

    const result = await response.json();

    if (result.code === 200 && result.data) {
      return {
        city: result.data.city || '',
        weather: result.data.weather || '',
      };
    }

    return {
      city: '',
      weather: '',
    };
  } catch (error) {
    console.error('获取位置和天气失败:', error);
    return {
      city: '',
      weather: '',
    };
  }
};
