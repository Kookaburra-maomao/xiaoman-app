/**
 * 隐私协议同意管理
 * 用于控制敏感权限和SDK的初始化时机
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_CONSENT_KEY = '@privacy_consent_agreed';

/**
 * 保存用户同意隐私协议的状态
 */
export const setPrivacyConsent = async (agreed: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRIVACY_CONSENT_KEY, agreed ? 'true' : 'false');
    console.log('[Privacy] 隐私协议同意状态已保存:', agreed);
  } catch (error) {
    console.error('[Privacy] 保存隐私协议同意状态失败:', error);
  }
};

/**
 * 获取用户是否同意隐私协议
 */
export const getPrivacyConsent = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PRIVACY_CONSENT_KEY);
    const agreed = value === 'true';
    console.log('[Privacy] 隐私协议同意状态:', agreed);
    return agreed;
  } catch (error) {
    console.error('[Privacy] 获取隐私协议同意状态失败:', error);
    return false;
  }
};

/**
 * 清除隐私协议同意状态（用于退出登录或重置）
 */
export const clearPrivacyConsent = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PRIVACY_CONSENT_KEY);
    console.log('[Privacy] 隐私协议同意状态已清除');
  } catch (error) {
    console.error('[Privacy] 清除隐私协议同意状态失败:', error);
  }
};
