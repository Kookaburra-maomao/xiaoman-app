/**
 * JWT 认证上下文
 * 
 * 功能：
 * 1. 管理全局认证状态（user, isAuthenticated, login, logout）
 * 2. App 启动时自动检查 token 并获取用户信息
 * 3. App 从后台切换到前台时自动刷新用户信息
 * 4. 网络从断开到连接时自动刷新用户信息
 * 5. 定期心跳机制（每 30 分钟调用一次接口）
 */

import { clearJwtUser, getJwtUser, jwtGetMe, jwtLogin, jwtLogout, jwtUpdateUser, JwtUser } from '@/utils/jwtAuth';
import { clearJwtToken, getJwtToken, setTokenRefreshCallback, setUnauthorizedCallback } from '@/utils/jwtRequest';
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface JwtAuthContextType {
  user: JwtUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUserInfo: (user: JwtUser) => Promise<void>;
  setUser: (user: JwtUser | null) => void;
}

const JwtAuthContext = createContext<JwtAuthContextType | undefined>(undefined);

// 心跳间隔：30 分钟
const HEARTBEAT_INTERVAL = 30 * 60 * 1000;

// 全局状态，防止重复初始化
let globalInitPromise: Promise<{ user: JwtUser | null }> | null = null;

export const JwtAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<JwtUser | null>(null);
  const [loading, setLoading] = useState(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshAuthRef = useRef<(() => Promise<void>) | undefined>(undefined);

  /**
   * 刷新用户信息（触发自动续期）
   */
  const refreshAuth = useCallback(async () => {
    // 防止并发刷新
    if (isRefreshingRef.current) {
      console.log('[JWT Auth] 正在刷新中，跳过');
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('[JWT Auth] 刷新用户信息 - 调用栈:', new Error().stack?.split('\n').slice(1, 4).join('\n'));
      const userData = await jwtGetMe();
      setUser(userData);
    } catch (error) {
      console.error('[JWT Auth] 刷新用户信息失败:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // 保持 refreshAuth 的最新引用
  useEffect(() => {
    refreshAuthRef.current = refreshAuth;
  }, [refreshAuth]);

  /**
   * 处理 401 错误（token 过期或无效）
   */
  const handleUnauthorized = useCallback(async () => {
    console.log('[JWT Auth] Token 无效，清除用户状态');
    setUser(null);
    await clearJwtToken();
    await clearJwtUser();
  }, []);

  /**
   * 处理 token 刷新
   */
  const handleTokenRefresh = useCallback((newToken: string) => {
    console.log('[JWT Auth] Token 已更新');
    // Token 已在 jwtRequest 中保存，这里只需要记录日志
  }, []);

  /**
   * 初始化认证状态
   */
  useEffect(() => {
    const initAuth = async () => {
      // 如果已经有初始化 Promise，等待它完成
      if (globalInitPromise) {
        console.log('[JWT Auth] 等待全局初始化完成');
        try {
          const result = await globalInitPromise;
          setUser(result.user);
          setLoading(false);
          console.log('[JWT Auth] 使用全局初始化结果:', result.user ? { id: result.user.id } : null);
        } catch (error) {
          console.error('[JWT Auth] 全局初始化失败:', error);
          setLoading(false);
        }
        return;
      }

      // 创建初始化 Promise
      console.log('[JWT Auth] 开始全局初始化');
      globalInitPromise = (async () => {
        try {
          console.log('[JWT Auth] 初始化认证状态');
          
          // 先从本地获取用户信息（快速显示）
          const localUser = await getJwtUser();
          console.log('[JWT Auth] 本地用户信息:', localUser ? { id: localUser.id, username: localUser.username } : null);
          
          if (localUser) {
            setUser(localUser);
            setLoading(false);
          }

          // 然后从服务器验证并刷新（触发自动续期）
          // 只有在有 token 的情况下才调用
          const token = await getJwtToken();
          if (token) {
            console.log('[JWT Auth] 有 token，验证用户信息');
            const serverUser = await jwtGetMe();
            console.log('[JWT Auth] 服务器用户信息:', serverUser ? { id: serverUser.id, username: serverUser.username } : null);
            
            if (serverUser) {
              setUser(serverUser);
              return { user: serverUser };
            } else if (!localUser) {
              setUser(null);
              return { user: null };
            }
            return { user: localUser };
          } else {
            console.log('[JWT Auth] 没有 token，跳过服务器验证');
            if (!localUser) {
              setUser(null);
            }
            return { user: localUser };
          }
        } catch (error) {
          console.error('[JWT Auth] 初始化认证失败:', error);
          const localUser = await getJwtUser();
          if (localUser) {
            setUser(localUser);
            return { user: localUser };
          } else {
            setUser(null);
            return { user: null };
          }
        } finally {
          setLoading(false);
        }
      })();

      // 等待初始化完成
      await globalInitPromise;
    };

    initAuth();
  }, []);

  /**
   * 设置回调函数
   */
  useEffect(() => {
    setUnauthorizedCallback(handleUnauthorized);
    setTokenRefreshCallback(handleTokenRefresh);

    return () => {
      setUnauthorizedCallback(null);
      setTokenRefreshCallback(null);
    };
  }, [handleUnauthorized, handleTokenRefresh]);

  /**
   * App 生命周期监听（从后台切换到前台时刷新）
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // 从后台切换到前台
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[JWT Auth] App 切换到前台，刷新用户信息');
        if (user && refreshAuthRef.current) {
          refreshAuthRef.current();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [user?.id]); // 只依赖 user.id，避免 user 对象变化导致重复执行

  /**
   * 网络状态监听（网络恢复时刷新）
   */
  useEffect(() => {
    let previousIsConnected: boolean | null = null;
    
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('[JWT Auth] 网络状态变化:', { 
        isConnected: state.isConnected, 
        previousIsConnected,
        hasUser: !!user 
      });
      
      // 只在网络从断开到连接时刷新（避免频繁刷新）
      if (state.isConnected && previousIsConnected === false && user && refreshAuthRef.current) {
        console.log('[JWT Auth] 网络已恢复，刷新用户信息');
        refreshAuthRef.current();
      }
      
      previousIsConnected = state.isConnected;
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]); // 只依赖 user.id，避免 user 对象变化导致重复执行

  /**
   * 定期心跳机制（30 分钟）
   */
  useEffect(() => {
    if (!user) {
      // 用户未登录，清除心跳定时器
      if (heartbeatTimerRef.current) {
        console.log('[JWT Auth] 清除心跳定时器');
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    // 避免重复创建定时器
    if (heartbeatTimerRef.current) {
      console.log('[JWT Auth] 心跳定时器已存在，跳过创建');
      return;
    }

    // 用户已登录，设置心跳定时器
    console.log('[JWT Auth] 启动心跳定时器（30 分钟）');
    heartbeatTimerRef.current = setInterval(() => {
      console.log('[JWT Auth] 心跳：刷新用户信息');
      if (refreshAuthRef.current) {
        refreshAuthRef.current();
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatTimerRef.current) {
        console.log('[JWT Auth] 组件卸载，清除心跳定时器');
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [user?.id]); // 只依赖 user.id，避免 user 对象变化导致重复执行

  /**
   * 登录
   */
  const handleLogin = useCallback(async (phone: string, code: string) => {
    const userData = await jwtLogin(phone, code);
    console.log('[JWT Auth] 登录成功，用户信息:', userData ? { id: userData.id, username: userData.username } : null);
    setUser(userData);
    await new Promise(resolve => setTimeout(resolve, 0));
  }, []);

  /**
   * 登出
   */
  const handleLogout = useCallback(async () => {
    setUser(null);
    await jwtLogout();
    await new Promise(resolve => setTimeout(resolve, 0));
  }, []);

  /**
   * 更新用户信息
   */
  const handleUpdateUserInfo = useCallback(async (updatedUser: JwtUser) => {
    if (!updatedUser.id) {
      throw new Error('用户ID不存在');
    }

    try {
      console.log('[JWT Auth] 更新用户信息，调用服务端接口');
      
      // 调用服务端接口更新用户信息
      const serverUser = await jwtUpdateUser(updatedUser.id, updatedUser);
      
      // 更新本地状态
      setUser(serverUser);
      
      console.log('[JWT Auth] 用户信息更新成功');
    } catch (error: any) {
      console.error('[JWT Auth] 更新用户信息失败:', error);
      throw error;
    }
  }, []);

  const value: JwtAuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    logout: handleLogout,
    refreshAuth,
    updateUserInfo: handleUpdateUserInfo,
    setUser,
  };

  // 监听 user 状态变化
  useEffect(() => {
    console.log('[JWT Auth] User 状态变化:', user ? { id: user.id, username: user.username, isAuthenticated: true } : { isAuthenticated: false });
  }, [user]);

  return <JwtAuthContext.Provider value={value}>{children}</JwtAuthContext.Provider>;
};

export const useJwtAuth = (): JwtAuthContextType => {
  const context = useContext(JwtAuthContext);
  if (context === undefined) {
    throw new Error('useJwtAuth must be used within a JwtAuthProvider');
  }
  return context;
};
