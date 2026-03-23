/**
 * 权限管理工具
 * 在申请权限之前显示说明弹窗，符合隐私合规要求
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_EXPLAINED_PREFIX = '@permission_explained_';
const PERMISSION_DENIED_PREFIX = '@permission_denied_';
const PERMISSION_DENIED_TIME_PREFIX = '@permission_denied_time_';

/**
 * 检查是否已经向用户说明过该权限
 */
export const hasExplainedPermission = async (permissionType: string): Promise<boolean> => {
  try {
    const key = `${PERMISSION_EXPLAINED_PREFIX}${permissionType}`;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (error) {
    console.error('[Permission] 检查权限说明状态失败:', error);
    return false;
  }
};

/**
 * 标记已经向用户说明过该权限
 */
export const markPermissionExplained = async (permissionType: string): Promise<void> => {
  try {
    const key = `${PERMISSION_EXPLAINED_PREFIX}${permissionType}`;
    await AsyncStorage.setItem(key, 'true');
    console.log('[Permission] 已标记权限说明:', permissionType);
  } catch (error) {
    console.error('[Permission] 标记权限说明失败:', error);
  }
};

/**
 * 记录用户拒绝了该权限
 */
export const markPermissionDenied = async (permissionType: string): Promise<void> => {
  try {
    const key = `${PERMISSION_DENIED_PREFIX}${permissionType}`;
    const timeKey = `${PERMISSION_DENIED_TIME_PREFIX}${permissionType}`;
    await AsyncStorage.setItem(key, 'true');
    await AsyncStorage.setItem(timeKey, Date.now().toString());
    console.log('[Permission] 已记录权限拒绝:', permissionType);
  } catch (error) {
    console.error('[Permission] 记录权限拒绝失败:', error);
  }
};

/**
 * 检查用户是否拒绝过该权限
 */
export const hasPermissionDenied = async (permissionType: string): Promise<boolean> => {
  try {
    const key = `${PERMISSION_DENIED_PREFIX}${permissionType}`;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (error) {
    console.error('[Permission] 检查权限拒绝状态失败:', error);
    return false;
  }
};

/**
 * 获取权限被拒绝的时间
 */
export const getPermissionDeniedTime = async (permissionType: string): Promise<number | null> => {
  try {
    const timeKey = `${PERMISSION_DENIED_TIME_PREFIX}${permissionType}`;
    const value = await AsyncStorage.getItem(timeKey);
    return value ? parseInt(value, 10) : null;
  } catch (error) {
    console.error('[Permission] 获取权限拒绝时间失败:', error);
    return null;
  }
};

/**
 * 清除权限拒绝记录（用户主动触发权限相关功能时）
 */
export const clearPermissionDenied = async (permissionType: string): Promise<void> => {
  try {
    const key = `${PERMISSION_DENIED_PREFIX}${permissionType}`;
    const timeKey = `${PERMISSION_DENIED_TIME_PREFIX}${permissionType}`;
    await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem(timeKey);
    console.log('[Permission] 已清除权限拒绝记录:', permissionType);
  } catch (error) {
    console.error('[Permission] 清除权限拒绝记录失败:', error);
  }
};

/**
 * 清除所有权限说明记录（用于退出登录或重置）
 */
export const clearAllPermissionExplained = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const permissionKeys = keys.filter(key => 
      key.startsWith(PERMISSION_EXPLAINED_PREFIX) ||
      key.startsWith(PERMISSION_DENIED_PREFIX) ||
      key.startsWith(PERMISSION_DENIED_TIME_PREFIX)
    );
    await AsyncStorage.multiRemove(permissionKeys);
    console.log('[Permission] 已清除所有权限说明记录');
  } catch (error) {
    console.error('[Permission] 清除权限说明记录失败:', error);
  }
};
