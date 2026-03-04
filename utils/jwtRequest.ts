/**
 * JWT 请求工具 - 支持自动续期
 * 
 * 功能：
 * 1. 自动在请求头添加 Authorization: Bearer {token}
 * 2. 自动检测响应头 X-New-Token 并更新本地存储
 * 3. 处理 401 错误，清除 token 并触发登出
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const JWT_TOKEN_KEY = '@xiaoman_jwt_token';
const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 登出回调函数（由 AuthContext 设置）
let onUnauthorizedCallback: (() => void) | null = null;

// Token 更新回调函数（用于通知 AuthContext token 已更新）
let onTokenRefreshCallback: ((token: string) => void) | null = null;

/**
 * 设置未授权回调（401 错误时调用）
 */
export const setUnauthorizedCallback = (callback: (() => void) | null) => {
  onUnauthorizedCallback = callback;
};

/**
 * 设置 Token 刷新回调
 */
export const setTokenRefreshCallback = (callback: ((token: string) => void) | null) => {
  onTokenRefreshCallback = callback;
};

/**
 * 保存 JWT Token
 */
export const saveJwtToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(JWT_TOKEN_KEY, token);
  } catch (error) {
    console.error('保存 JWT Token 失败:', error);
  }
};

/**
 * 获取 JWT Token
 */
export const getJwtToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('获取 JWT Token 失败:', error);
    return null;
  }
};

/**
 * 清除 JWT Token
 */
export const clearJwtToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(JWT_TOKEN_KEY);
  } catch (error) {
    console.error('清除 JWT Token 失败:', error);
  }
};

/**
 * 创建 Axios 实例
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: apiUrl,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器：自动添加 Authorization 头
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await getJwtToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：自动检测并更新 token
  instance.interceptors.response.use(
    async (response: AxiosResponse) => {
      // 检查响应头中的新 token（注意：axios 会自动转换为小写）
      const newToken = response.headers['x-new-token'];
      
      if (newToken && typeof newToken === 'string') {
        console.log('[JWT] 检测到新 token，自动更新');
        await saveJwtToken(newToken);
        
        // 通知 AuthContext token 已更新
        if (onTokenRefreshCallback) {
          onTokenRefreshCallback(newToken);
        }
      }
      
      return response;
    },
    async (error: AxiosError) => {
      // 处理 401 错误
      if (error.response?.status === 401) {
        console.log('[JWT] 检测到 401 错误，清除 token 并触发登出');
        await clearJwtToken();
        
        // 触发登出回调
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// 创建全局 axios 实例
const jwtAxios = createAxiosInstance();

/**
 * 通用请求方法
 */
const request = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await jwtAxios.request<T>({
      url,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // 提取错误信息
      const message = axiosError.response?.data?.message 
        || axiosError.response?.data?.error
        || axiosError.message 
        || '请求失败';
      
      const customError: any = new Error(message);
      customError.status = axiosError.response?.status;
      customError.errors = axiosError.response?.data?.errors;
      
      throw customError;
    }
    throw error;
  }
};

/**
 * GET 请求
 */
export const jwtGet = <T = any>(url: string, params?: any): Promise<T> => {
  return request<T>(url, { method: 'GET', params });
};

/**
 * POST 请求
 */
export const jwtPost = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>(url, { method: 'POST', data });
};

/**
 * PUT 请求
 */
export const jwtPut = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>(url, { method: 'PUT', data });
};

/**
 * DELETE 请求
 */
export const jwtDel = <T = any>(url: string, params?: any): Promise<T> => {
  return request<T>(url, { method: 'DELETE', params });
};

export default jwtAxios;
