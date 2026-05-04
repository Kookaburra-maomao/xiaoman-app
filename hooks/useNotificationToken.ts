import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { post } from '@/utils/request';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotificationToken(userId?: string) {
  const registered = useRef(false);

  const registerForPushNotifications = useCallback(async () => {
    if (!Device.isDevice) return null;
    if (Platform.OS !== 'ios') return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  }, []);

  const saveTokenToServer = useCallback(async (token: string) => {
    try {
      await post('/api/push-notifications/register-token', {
        expo_push_token: token,
        device_type: Platform.OS,
      });
    } catch (e) {
      console.error('[Push] 保存 token 失败:', e);
    }
  }, []);

  useEffect(() => {
    if (!userId || registered.current) return;

    const register = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await saveTokenToServer(token);
        registered.current = true;
      }
    };

    register();
  }, [userId, registerForPushNotifications, saveTokenToServer]);
}
