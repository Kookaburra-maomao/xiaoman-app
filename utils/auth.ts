import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post, put } from './request';

const AUTH_STORAGE_KEY = '@xiaoman_auth_user';

/** 是否开启日记加密（进入记录页需面容/指纹验证） */
export const DIARY_ENCRYPTION_ENABLED_KEY = '@xiaoman_diary_encryption_enabled';

export interface User {
  id: string;
  username: string;
  nick?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  is_vip?: string;
  vip_expire_time?: string;
  /** 是否开启日记加密：'1' 开启，'0' 关闭 */
  diary_secret?: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: User;
}

export interface RegisterResponse {
  code: number;
  message: string;
  data: User;
}

// 保存用户信息到本地存储
export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
};

// 从本地存储获取用户信息
export const getUser = async (): Promise<User | null> => {
  try {
    const userStr = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

// 清除用户信息
export const clearUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.error('清除用户信息失败:', error);
  }
};

// 登录（用户名 + 密码）
export const login = async (username: string, password: string): Promise<User> => {
  const response = await post('/api/auth/login', {
    username,
    password,
  }) as LoginResponse;
  
  if (response.code === 200 && response.data) {
    await saveUser(response.data);
    return response.data;
  }
  
  throw new Error(response.message || '登录失败');
};

/** 手机号+验证码登录，建立服务端 session。isDebug=1 时后端跳过验证码校验，仅需 phone，code 可选 */
export const loginByPhone = async (
  phone: string,
  code: string,
  isDebug?: boolean
): Promise<User> => {
  const body: { phone: string; code?: string; isDebug?: number } = { phone };
  if (isDebug) {
    body.isDebug = 1;
    if (code) body.code = code;
  } else {
    body.code = code;
  }
  const response = await post('/api/auth/login', body) as LoginResponse;

  if (response.code === 200 && response.data) {
    await saveUser(response.data);
    return response.data;
  }

  throw new Error(response.message || '登录失败');
};

// 注册
export const register = async (
  username: string,
  password: string,
  nick?: string,
  phone?: string
): Promise<User> => {
  const response = await post('/api/auth/register', {
    username,
    password,
    nick,
    phone,
  }) as RegisterResponse;
  
  if (response.code === 200 && response.data) {
    await saveUser(response.data);
    return response.data;
  }
  
  throw new Error(response.message || '注册失败');
};

// 注销
export const logout = async (): Promise<void> => {
  try {
    await post('/api/auth/logout', {});
  } catch (error) {
    console.error('注销请求失败:', error);
  } finally {
    await clearUser();
  }
};

// 检查登录状态（从服务器获取当前用户信息）
export const checkAuth = async (): Promise<User | null> => {
  try {
    const response = await get('/api/auth/me') as { code: number; message: string; data: User };
    
    if (response.code === 200 && response.data) {
      await saveUser(response.data);
      return response.data;
    }
    
    // 如果未登录，清除本地存储
    await clearUser();
    return null;
  } catch (error: any) {
    // 401 表示未登录，清除本地存储
    if (error.status === 401) {
      await clearUser();
      return null;
    }
    
    // 网络请求失败（Network request failed）时，静默处理，不显示错误
    // 这可能是正常的网络问题，不影响应用启动
    if (error.message === 'Network request failed' || error.name === 'TypeError') {
      // 网络错误时，尝试使用本地存储的用户信息
      const localUser = await getUser();
      if (localUser) {
        // 有本地用户信息，返回它（保持登录状态）
        return localUser;
      }
      return null;
    }
    
    // 其他错误才打印日志，但不清除本地存储
    console.error('检查登录状态失败:', error);
    // 发生其他错误时，尝试使用本地存储的用户信息
    const localUser = await getUser();
    return localUser;
  }
};

// 发送短信验证码
export const sendSmsCode = async (phone: string): Promise<void> => {
  const response = await get('/api/sms/send', { phone }) as { code: number; message: string; data?: any };
  
  if (response.code !== 200) {
    throw new Error(response.message || '发送验证码失败');
  }
};

// 验证短信验证码
export const verifySmsCode = async (phone: string, verifyCode: string): Promise<boolean> => {
  const response = await post('/api/sms/verify', {
    phoneNumber: phone,
    VerifyCode: verifyCode,
  }) as { code: number; message: string; data?: { phone: string; verified: boolean } };
  
  if (response.code === 200 && response.data?.verified) {
    return true;
  }
  
  throw new Error(response.message || '验证码验证失败');
};

// 通过手机号查询用户
export const getUserByPhone = async (phone: string): Promise<User | null> => {
  const response = await get('/api/users/by-phone', { phone }) as { 
    code: number; 
    message: string; 
    data: User[] 
  };
  
  if (response.code === 200 && response.data && response.data.length > 0) {
    return response.data[0];
  }
  
  return null;
};

// 生成6位随机数
const generateRandomNumber = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 通过手机号自动注册
export const autoRegisterByPhone = async (phone: string): Promise<User> => {
  const username = phone;
  const password = '111111';
  const nick = `小满用户_${generateRandomNumber()}`;
  
  const response = await post('/api/auth/register', {
    username,
    password,
    nick,
    phone,
  }) as RegisterResponse;
  
  if (response.code === 200 && response.data) {
    await saveUser(response.data);
    return response.data;
  }
  
  throw new Error(response.message || '注册失败');
};

// 更新用户信息
export const updateUser = async (userId: string, data: { avatar?: string; diary_secret?: string }): Promise<User> => {
  const response = await put(`/api/users/${userId}`, data) as { 
    code: number; 
    message: string; 
    data: User 
  };
  
  if (response.code === 200 && response.data) {
    await saveUser(response.data);
    return response.data;
  }
  
  throw new Error(response.message || '更新用户信息失败');
};
