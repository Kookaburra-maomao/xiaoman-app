import { User, checkAuth, getUser, login, logout, register, saveUser, updateUser } from '@/utils/auth';
import { getLastRequestTime, setRequestCallback } from '@/utils/request';
import React, { ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nick?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUserInfo: (data: { avatar?: string; diary_secret?: string }) => Promise<void>;
  updateVipExpireTime: (vipExpireTime: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 30分钟 = 30 * 60 * 1000 毫秒
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 检查会话超时
  const checkSessionTimeout = useCallback(async () => {
    if (!user) return;

    const now = Date.now();
    const lastRequestTime = getLastRequestTime();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest >= SESSION_TIMEOUT) {
      // 超过30分钟没有请求，自动登出
      console.log('会话超时，自动登出');
      setUser(null);
      await logout();
    }
  }, [user]);

  // 设置请求回调（用于调试或未来扩展）
  useEffect(() => {
    const handleRequest = (requestTime: number) => {
      // 请求时间已由 request.js 自动更新，这里可以用于日志记录等
      console.log('网络请求时间更新:', new Date(requestTime).toLocaleString());
    };

    setRequestCallback(handleRequest);

    return () => {
      setRequestCallback(null);
    };
  }, []);

  // 设置定时器检查会话超时
  useEffect(() => {
    if (!user) {
      // 如果用户未登录，清除定时器
      if (timeoutTimerRef.current) {
        clearInterval(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      return;
    }

    // 用户已登录，设置定时器每1分钟检查一次
    timeoutTimerRef.current = setInterval(() => {
      checkSessionTimeout();
    }, 60 * 1000); // 每分钟检查一次

    return () => {
      if (timeoutTimerRef.current) {
        clearInterval(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
    };
  }, [user, checkSessionTimeout]);

  // 初始化时检查登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 先尝试从本地获取用户信息（快速显示，提升用户体验）
        const localUser = await getUser();
        if (localUser) {
          setUser(localUser);
          // 设置 loading 为 false，允许应用继续渲染
          setLoading(false);
        }
        
        // 然后从服务器验证（这会触发网络请求，自动更新最后请求时间）
        // 注意：即使服务器验证失败，如果本地有用户信息，也会保留登录状态
        const serverUser = await checkAuth();
        if (serverUser) {
          setUser(serverUser);
        } else if (!localUser) {
          // 如果服务器验证失败且本地也没有用户信息，才清除状态
          setUser(null);
        }
        // 如果服务器验证失败但本地有用户信息，保持本地用户信息（已登录状态）
      } catch (error) {
        console.error('初始化认证失败:', error);
        // 发生错误时，尝试使用本地存储的用户信息
        const localUser = await getUser();
        if (localUser) {
          setUser(localUser);
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    const userData = await login(username, password);
    // 立即更新状态，确保 isAuthenticated 同步更新
    // login 函数内部会调用网络请求，自动更新最后请求时间
    setUser(userData);
    // 等待状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));
  }, []);

  const handleRegister = useCallback(
    async (username: string, password: string, nick?: string, phone?: string) => {
      const userData = await register(username, password, nick, phone);
      // register 函数内部会调用网络请求，自动更新最后请求时间
      setUser(userData);
    },
    []
  );

  const handleLogout = useCallback(async () => {
    // 先清除状态，确保 isAuthenticated 立即更新
    setUser(null);
    // 然后执行登出 API 调用
    await logout();
    // 等待状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));
  }, []);

  const refreshAuth = useCallback(async () => {
    // checkAuth 函数内部会调用网络请求，自动更新最后请求时间
    const userData = await checkAuth();
    setUser(userData);
  }, []);

  const handleUpdateUserInfo = useCallback(async (data: { avatar?: string; diary_secret?: string }) => {
    if (!user?.id) {
      throw new Error('用户信息不存在');
    }
    const updatedUser = await updateUser(user.id, data);
    setUser(updatedUser);
  }, [user?.id]);

  const handleUpdateVipExpireTime = useCallback(async (vipExpireTime: string) => {
    if (!user) {
      throw new Error('用户信息不存在');
    }
    // 更新用户信息中的 vip_expire_time
    const updatedUser: User = {
      ...user,
      vip_expire_time: vipExpireTime,
      is_vip: 'true', // 设置会员状态为 true
    };
    // 更新 context 中的 user
    setUser(updatedUser);
    // 更新本地存储
    await saveUser(updatedUser);
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshAuth,
    updateUserInfo: handleUpdateUserInfo,
    updateVipExpireTime: handleUpdateVipExpireTime,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

