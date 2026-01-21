import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Audio } from 'expo-av';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function RootLayoutContent() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const prevAuthenticatedRef = useRef<boolean | null>(null);

  // 请求录音权限
  useEffect(() => {
    const requestAudioPermission = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('录音权限未授予');
        }
      } catch (error) {
        console.error('请求录音权限失败:', error);
      }
    };

    requestAudioPermission();
  }, []);

  useEffect(() => {
    console.log('[Route Guard] Effect triggered', {
      loading,
      isAuthenticated,
      segments: segments[0],
      prevAuth: prevAuthenticatedRef.current,
    });

    if (loading) {
      console.log('[Route Guard] Still loading, skipping');
      return;
    }

    const currentRoute = segments[0];
    const isLoginPage = currentRoute === 'login';
    const isTabsPage = currentRoute === '(tabs)';

    // 初始化时，设置初始值并执行跳转逻辑
    if (prevAuthenticatedRef.current === null) {
      console.log('[Route Guard] Initializing, setting prevAuth to', isAuthenticated);
      prevAuthenticatedRef.current = isAuthenticated;
      // 初始化时也需要执行跳转逻辑
      if (!isAuthenticated && !isLoginPage) {
        console.log('[Route Guard] Not authenticated and not on login page, redirecting to login');
        router.replace('/login');
      } else if (isAuthenticated && isLoginPage) {
        console.log('[Route Guard] Authenticated and on login page, redirecting to chat');
        router.replace('/(tabs)/chat');
      }
      return;
    }

    // 如果认证状态没有变化，不执行跳转（避免重复跳转）
    if (prevAuthenticatedRef.current === isAuthenticated) {
      console.log('[Route Guard] Auth state unchanged, skipping');
      return;
    }

    console.log('[Route Guard] Auth state changed from', prevAuthenticatedRef.current, 'to', isAuthenticated);
    // 状态发生变化，更新 ref
    prevAuthenticatedRef.current = isAuthenticated;

    // 使用 setTimeout 确保状态更新完成后再执行跳转
    setTimeout(() => {
      if (!isAuthenticated) {
        // 未登录，如果不在登录页，重定向到登录页
        if (!isLoginPage) {
          console.log('[Route Guard] Executing redirect to login');
          router.replace('/login');
        }
      } else {
        // 已登录，如果在登录页，重定向到主页面
        if (isLoginPage) {
          console.log('[Route Guard] Executing redirect to chat');
          router.replace('/(tabs)/chat');
        }
      }
    }, 0);
  }, [isAuthenticated, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
        flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
