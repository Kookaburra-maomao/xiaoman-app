import { User, checkAuth, getUser, login, logout, register } from '@/utils/auth';
import { useCallback, useEffect, useState } from 'react';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nick?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查登录状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 先尝试从本地获取
        const localUser = await getUser();
        if (localUser) {
          setUser(localUser);
        }
        
        // 然后从服务器验证
        const serverUser = await checkAuth();
        setUser(serverUser);
      } catch (error) {
        console.error('初始化认证失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    const userData = await login(username, password);
    // 立即更新状态，确保 isAuthenticated 同步更新
    setUser(userData);
    // 等待状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));
  }, []);

  const handleRegister = useCallback(
    async (username: string, password: string, nick?: string, phone?: string) => {
      const userData = await register(username, password, nick, phone);
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
    const userData = await checkAuth();
    setUser(userData);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshAuth,
  };
};

