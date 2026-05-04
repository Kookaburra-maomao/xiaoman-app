import { JwtAuthProvider, useJwtAuth } from '@/contexts/JwtAuthContext';
import { useNotificationToken } from '@/hooks/useNotificationToken';
import { disableFontScaling } from '@/utils/disableFontScaling';
import { scaleSize } from '@/utils/screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

// 禁用全局字体缩放，防止系统字体设置影响 app 布局
disableFontScaling();

function RootLayoutContent() {
  const { isAuthenticated, loading, user } = useJwtAuth();
  const segments = useSegments();
  const router = useRouter();
  const prevAuthenticatedRef = useRef<boolean | null>(null);

  useNotificationToken(isAuthenticated ? user?.id : undefined);

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
        {/* <Image
          source={require('@/assets/images/icon.png')}
          style={styles.loadingLogo}
          resizeMode="contain"
        />
        <Text style={styles.loadingText} allowFontScaling={false}>小满日记</Text> */}
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      gestureEnabled: false, // 禁用左右滑动返回手势
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <JwtAuthProvider>
      <RootLayoutContent />
    </JwtAuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingLogo: {
    width: scaleSize(178),
    height: scaleSize(178),
    borderRadius: 20,
  },
  loadingText: {
    marginTop: scaleSize(16),
    fontSize: 16,
    color: '#666666',
  },
});
