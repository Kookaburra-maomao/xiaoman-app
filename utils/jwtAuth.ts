/**
 * JWT 认证工具函数
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearJwtToken, getJwtToken, jwtGet, jwtPost, jwtPut, saveJwtToken } from './jwtRequest';

const JWT_USER_STORAGE_KEY = '@xiaoman_jwt_user';

export interface JwtUser {
  id: string;
  username: string;
  nick?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  is_vip?: string;
  vip_expire_time?: string;
  diary_secret?: string;
  chat_profile?: string;
  diary_profile?: string;
  is_week_new?: number;
  is_month_new?: number;
  is_year_new?: number;
  letter_version?: number;
}

export interface JwtLoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    user: JwtUser;
  };
}

export interface JwtUserResponse {
  code: number;
  message: string;
  data: JwtUser;
}

/**
 * 保存用户信息到本地存储
 */
export const saveJwtUser = async (user: JwtUser): Promise<void> => {
  try {
    await AsyncStorage.setItem(JWT_USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
};

/**
 * 从本地存储获取用户信息
 */
export const getJwtUser = async (): Promise<JwtUser | null> => {
  try {
    const userStr = await AsyncStorage.getItem(JWT_USER_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 清除用户信息
 */
export const clearJwtUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(JWT_USER_STORAGE_KEY);
  } catch (error) {
    console.error('清除用户信息失败:', error);
  }
};

/**
 * JWT 登录（手机号 + 验证码）
 */
export const jwtLogin = async (phone: string, code: string): Promise<JwtUser> => {
  const response = await jwtPost<JwtLoginResponse>('/api/auth-jwt/login', {
    phone,
    code,
  });

  if (response.code === 200 && response.data) {
    // 保存 token
    await saveJwtToken(response.data.token);
    // 保存用户信息
    await saveJwtUser(response.data.user);
    return response.data.user;
  }

  throw new Error(response.message || '登录失败');
};

/**
 * 获取当前用户信息（会触发自动续期）
 */
export const jwtGetMe = async (): Promise<JwtUser | null> => {
  console.log('[jwtAuth] jwtGetMe 被调用');
  
  try {
    const token = await getJwtToken();
    if (!token) {
      console.log('[jwtAuth] jwtGetMe: 没有 token');
      return null;
    }

    console.log('[jwtAuth] jwtGetMe: 发起请求');
    const response = await jwtGet<JwtUserResponse>('/api/auth-jwt/me');

    if (response.code === 200 && response.data) {
      await saveJwtUser(response.data);
      console.log('[jwtAuth] jwtGetMe: 成功获取用户信息');
      return response.data;
    }

    console.log('[jwtAuth] jwtGetMe: 响应码不是 200');
    return null;
  } catch (error: any) {
    console.error('[jwtAuth] jwtGetMe: 发生错误', error.message);
    
    // 401 表示未登录或 token 过期
    if (error.status === 401) {
      await clearJwtToken();
      await clearJwtUser();
      return null;
    }

    // 网络错误时，返回本地缓存的用户信息
    if (error.message === 'Network request failed' || error.name === 'TypeError') {
      const localUser = await getJwtUser();
      return localUser;
    }

    console.error('获取用户信息失败:', error);
    const localUser = await getJwtUser();
    return localUser;
  }
};

/**
 * 手动刷新 token
 */
export const jwtRefresh = async (): Promise<string | null> => {
  try {
    const response = await jwtPost<{ code: number; message: string; data: { token: string } }>(
      '/api/auth-jwt/refresh'
    );

    if (response.code === 200 && response.data?.token) {
      await saveJwtToken(response.data.token);
      return response.data.token;
    }

    return null;
  } catch (error: any) {
    console.error('刷新 token 失败:', error);
    
    // 401 表示 token 已过期，无法刷新
    if (error.status === 401) {
      await clearJwtToken();
      await clearJwtUser();
    }
    
    return null;
  }
};

/**
 * JWT 登出
 */
export const jwtLogout = async (): Promise<void> => {
  try {
    // 清除本地存储
    await clearJwtToken();
    await clearJwtUser();
  } catch (error) {
    console.error('登出失败:', error);
  }
};

/**
 * 检查 token 是否存在
 */
export const hasJwtToken = async (): Promise<boolean> => {
  const token = await getJwtToken();
  return !!token;
};

/**
 * 更新用户信息
 */
export const jwtUpdateUser = async (userId: string, updates: Partial<JwtUser>): Promise<JwtUser> => {
  console.log('[jwtAuth] jwtUpdateUser 被调用，userId:', userId, 'updates:', updates);
  
  try {
    const response = await jwtPut<JwtUserResponse>(`/api/users/${userId}`, updates);

    if (response.code === 200 && response.data) {
      // 保存更新后的用户信息到本地
      await saveJwtUser(response.data);
      console.log('[jwtAuth] jwtUpdateUser: 用户信息更新成功');
      return response.data;
    }

    throw new Error(response.message || '更新用户信息失败');
  } catch (error: any) {
    console.error('[jwtAuth] jwtUpdateUser: 发生错误', error.message);
    throw error;
  }
};
