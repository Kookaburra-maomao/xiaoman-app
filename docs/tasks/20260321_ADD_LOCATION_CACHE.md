# 添加位置信息缓存机制

## 任务时间
2026-03-21

## 任务目标
实现位置信息缓存机制，缓存有效期12小时，在位置获取失败时使用缓存兜底，减少位置获取失败的几率。

## 问题背景
在发起聊天时，需要获取用户位置信息（经纬度）传递给后端。但有时会出现位置获取失败的情况：
- 权限未授予
- GPS 信号弱
- 网络问题
- 超时（1秒）

这会导致聊天请求缺少位置信息，影响用户体验。

## 解决方案
实现位置缓存机制：
1. 成功获取位置后，保存到本地缓存
2. 缓存有效期：12小时
3. 获取位置失败时，使用缓存兜底
4. 缓存过期后自动清除

## 实施步骤

### 1. 创建位置缓存工具
**文件**: `utils/locationCache.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@xiaoman_location_cache';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12小时

export interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// 保存位置到缓存
export const saveLocationCache = async (
  latitude: number,
  longitude: number
): Promise<void> => {
  const cacheData: CachedLocation = {
    latitude,
    longitude,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
};

// 获取缓存的位置（检查有效期）
export const getLocationCache = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  const cacheStr = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
  if (!cacheStr) return null;

  const cacheData: CachedLocation = JSON.parse(cacheStr);
  const age = Date.now() - cacheData.timestamp;

  // 检查是否过期
  if (age > CACHE_DURATION) {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  }

  return {
    latitude: cacheData.latitude,
    longitude: cacheData.longitude,
  };
};

// 清除缓存
export const clearLocationCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
};
```

### 2. 修改位置服务
**文件**: `services/locationService.ts`

#### getCurrentLocation 函数
```typescript
import { getLocationCache, saveLocationCache } from '@/utils/locationCache';

export const getCurrentLocation = async () => {
  try {
    // 尝试获取实时位置
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    if (location) {
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      // 保存到缓存
      await saveLocationCache(coords.latitude, coords.longitude);
      return coords;
    }

    // 获取失败，使用缓存
    return await getLocationCache();
  } catch (error) {
    // 异常时使用缓存
    return await getLocationCache();
  }
};
```

#### getLocationAndWeather 函数
```typescript
export const getLocationAndWeather = async () => {
  try {
    // 尝试获取实时位置
    const location = await Location.getCurrentPositionAsync(...);

    if (location) {
      const { latitude, longitude } = location.coords;
      
      // 保存到缓存
      await saveLocationCache(latitude, longitude);
      
      // 获取天气
      return await fetchWeatherByCoords(latitude, longitude);
    }

    // 获取失败，使用缓存
    const cachedLocation = await getLocationCache();
    if (cachedLocation) {
      return await fetchWeatherByCoords(
        cachedLocation.latitude,
        cachedLocation.longitude
      );
    }

    return { city: '', weather: '' };
  } catch (error) {
    // 异常时使用缓存
    const cachedLocation = await getLocationCache();
    if (cachedLocation) {
      return await fetchWeatherByCoords(
        cachedLocation.latitude,
        cachedLocation.longitude
      );
    }
    return { city: '', weather: '' };
  }
};
```

#### 新增辅助函数
```typescript
// 根据经纬度获取天气信息
const fetchWeatherByCoords = async (
  latitude: number,
  longitude: number
): Promise<{ city: string; weather: string }> => {
  const response = await fetch(`${apiUrl}/api/weather/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });

  if (!response.ok) {
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
};
```

## 完成情况
- ✅ 创建位置缓存工具 `utils/locationCache.ts`
- ✅ 实现保存缓存功能 `saveLocationCache`
- ✅ 实现读取缓存功能 `getLocationCache`（带过期检查）
- ✅ 实现清除缓存功能 `clearLocationCache`
- ✅ 修改 `getCurrentLocation` 集成缓存
- ✅ 修改 `getLocationAndWeather` 集成缓存
- ✅ 提取 `fetchWeatherByCoords` 辅助函数
- ✅ 添加详细日志输出
- ✅ TypeScript 类型检查通过

## 相关文件
- `utils/locationCache.ts` - 位置缓存工具（新建）
- `services/locationService.ts` - 位置服务（修改）

## 工作流程

### 正常流程（位置获取成功）
1. 调用 `getCurrentLocation()` 或 `getLocationAndWeather()`
2. 请求位置权限
3. 获取实时位置（1秒或3秒超时）
4. 保存位置到缓存（带时间戳）
5. 返回位置信息

### 失败流程（位置获取失败）
1. 调用 `getCurrentLocation()` 或 `getLocationAndWeather()`
2. 位置获取失败（权限拒绝/超时/异常）
3. 读取缓存位置
4. 检查缓存是否过期（12小时）
5. 如果缓存有效，返回缓存位置
6. 如果缓存无效或不存在，返回 null 或空值

### 缓存过期处理
- 缓存年龄 > 12小时：自动删除缓存，返回 null
- 缓存年龄 ≤ 12小时：返回缓存位置

## 缓存数据结构
```typescript
{
  latitude: number,      // 纬度
  longitude: number,     // 经度
  timestamp: number      // 保存时间戳（毫秒）
}
```

## 日志输出
```
[LocationCache] 位置信息已缓存: { latitude: 39.9042, longitude: 116.4074 }
[LocationCache] 使用缓存位置，年龄: 120 分钟
[LocationCache] 缓存已过期，年龄: 750 分钟
[LocationCache] 无缓存数据
[Location] 获取位置失败，尝试使用缓存
[LocationWeather] 位置权限未授予，尝试使用缓存
```

## 优势
1. **提高成功率**: 位置获取失败时有缓存兜底
2. **减少延迟**: 缓存命中时无需等待 GPS 定位
3. **节省电量**: 减少 GPS 使用频率
4. **用户体验**: 避免因位置获取失败导致功能不可用
5. **合理过期**: 12小时有效期，平衡准确性和可用性

## 注意事项
1. **缓存有效期**: 12小时后自动过期，确保位置不会太旧
2. **隐私保护**: 位置信息仅存储在本地设备
3. **错误处理**: 所有缓存操作都有 try-catch 保护
4. **日志输出**: 详细的日志便于调试和监控
5. **向后兼容**: 不影响现有功能，仅作为兜底方案

## 测试建议

### 测试场景
1. **首次使用**: 无缓存，获取实时位置
2. **正常使用**: 有缓存，获取实时位置并更新缓存
3. **权限拒绝**: 使用缓存位置
4. **GPS 信号弱**: 超时后使用缓存位置
5. **缓存过期**: 超过12小时，缓存失效
6. **飞行模式**: 无法获取位置，使用缓存

### 测试步骤
1. 清除应用数据，首次启动
2. 授予位置权限，发起聊天
3. 验证位置已缓存（查看日志）
4. 关闭位置权限，再次发起聊天
5. 验证使用了缓存位置（查看日志）
6. 等待12小时后，验证缓存过期

### 验证方法
- 查看控制台日志
- 检查 AsyncStorage 中的缓存数据
- 验证聊天请求中的位置参数

## 相关文档
- [AI 协作约定](../../AI_CONVENTIONS.md)
- [AsyncStorage 文档](https://react-native-async-storage.github.io/async-storage/)
- [Expo Location 文档](https://docs.expo.dev/versions/latest/sdk/location/)

## 后续优化建议
1. 可以考虑添加缓存统计（命中率、使用次数）
2. 可以根据用户移动速度动态调整缓存有效期
3. 可以添加手动刷新位置的功能
4. 可以在设置页面显示当前缓存的位置信息
