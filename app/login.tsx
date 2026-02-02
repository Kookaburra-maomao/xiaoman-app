import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { autoRegisterByPhone, getUserByPhone, loginByPhone, saveUser, sendSmsCode, verifySmsCode } from '@/utils/auth';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LOGO_URL = 'http://xiaomanriji.com/api/files/xiaoman.png';
const SLOGAN_URL = 'http://xiaomanriji.com/api/files/xiaoman-slogan.png';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  // TODO: 上线前移除调试功能
  const [debugMode, setDebugMode] = useState(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const { refreshAuth, setUser } = useAuth();

  // 清理倒计时
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // 手机号验证（11位数字）
  const isValidPhone = (phoneNumber: string): boolean => {
    return /^1[3-9]\d{9}$/.test(phoneNumber);
  };

  // 发送验证码
  const handleSendCode = async () => {
    const trimmedPhone = phone.trim();
    
    if (!trimmedPhone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    // TODO: 上线前移除调试功能 - 调试模式下跳过发送验证码
    if (debugMode) {
      Alert.alert('调试模式', '调试模式已开启，请输入验证码 9999');
      return;
    }

    try {
      setSendingCode(true);
      await sendSmsCode(trimmedPhone);
      Alert.alert('成功', '验证码已发送');
      
      // 开始倒计时
      setCountdown(60);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('错误', error.message || '发送验证码失败，请重试');
    } finally {
      setSendingCode(false);
    }
  };

  // 验证验证码并登录/注册
  const handleVerify = async () => {
    const trimmedPhone = phone.trim();
    const trimmedCode = verifyCode.trim();

    if (!trimmedPhone) {
      Alert.alert('提示', '请输入手机号');
      return;
    }

    if (!isValidPhone(trimmedPhone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }

    // Debug 模式只需手机号；非 Debug 需要 4 位验证码
    if (!debugMode && (!trimmedCode || trimmedCode.length !== 4)) {
      Alert.alert('提示', '请输入4位验证码');
      return;
    }

    try {
      setVerifying(true);

      if (!debugMode) {
        // 1. 非 Debug：先验证验证码
        await verifySmsCode(trimmedPhone, trimmedCode);
      }

      // 2. 手机号登录，建立服务端 session。Debug 模式传 isDebug: 1，后端跳过验证码校验
      let user = null;
      try {
        user = await loginByPhone(trimmedPhone, trimmedCode, debugMode);
      } catch (e: any) {
        // 登录失败则尝试自动注册（新用户）
        try {
          user = await autoRegisterByPhone(trimmedPhone);
        } catch (regErr: any) {
          // 注册失败且提示用户已存在时，仅拉取用户信息并写入本地（此时服务端可能未建立 session，需后端支持手机号登录）
          if (regErr?.message?.includes('已存在') || regErr?.message?.includes('已注册')) {
            user = await getUserByPhone(trimmedPhone);
            if (user) {
              await saveUser(user);
            }
          }
          if (!user) throw regErr;
        }
      }
      if (user) {
        setUser(user);
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/(tabs)/chat');
      }
    } catch (error: any) {
      Alert.alert('错误', error.message || '验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar hidden />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <Image
              source={{ uri: LOGO_URL }}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Slogan */}
            <Image
              source={{ uri: SLOGAN_URL }}
              style={styles.slogan}
              resizeMode="contain"
            />

            <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="请输入手机号"
                placeholderTextColor={Colors.light.icon}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={11}
                editable={!sendingCode && !verifying}
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.verifyCodeContainer}>
                <TextInput
                  style={styles.verifyCodeInput}
                  placeholder="请输入验证码"
                  placeholderTextColor={Colors.light.icon}
                  value={verifyCode}
                  onChangeText={setVerifyCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!verifying}
                />
                <TouchableOpacity
                  style={[
                    styles.sendCodeButton,
                    (!isValidPhone(phone.trim()) || countdown > 0 || sendingCode) && styles.sendCodeButtonDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={!isValidPhone(phone.trim()) || countdown > 0 || sendingCode}
                >
                  {sendingCode ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : countdown > 0 ? (
                    <Text style={styles.sendCodeButtonText}>{countdown}秒</Text>
                  ) : (
                    <Text style={styles.sendCodeButtonText}>获取验证码</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, verifying && styles.submitButtonDisabled]}
              onPress={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>登录/注册</Text>
              )}
            </TouchableOpacity>

            {/* TODO: 上线前移除调试功能 */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugLabel}>调试模式（输入9999跳过验证）</Text>
              <Switch
                value={debugMode}
                onValueChange={setDebugMode}
                trackColor={{ false: '#CCCCCC', true: Colors.light.tint }}
                thumbColor="#FFFFFF"
              />
            </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: scaleSize(40),
  },
  content: {
    paddingHorizontal: scaleSize(24),
    alignItems: 'center',
  },
  logo: {
    width: scaleSize(80),
    height: scaleSize(80),
    marginTop: scaleSize(120),
    marginBottom: scaleSize(24),
  },
  slogan: {
    width: scaleSize(105),
    height: scaleSize(15),
    marginBottom: scaleSize(60),
  },
  form: {
    marginTop: scaleSize(120),
    width: '100%',
  },
  inputContainer: {
    marginBottom: scaleSize(20),
  },
  label: {
    fontSize: scaleSize(14),
    color: Colors.light.text,
    marginBottom: scaleSize(8),
    fontWeight: '500',
  },
  input: {
    height: scaleSize(50),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(8),
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#000000',
  },
  verifyCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: '#000',
    padding: scaleSize(2),
    gap: scaleSize(2),
  },
  verifyCodeInput: {
    flex: 1,
    height: scaleSize(46),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(6),
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
    color: Colors.light.text,
  },
  sendCodeButton: {
    height: scaleSize(46),
    backgroundColor: '#000000',
    borderRadius: scaleSize(6),
    paddingHorizontal: scaleSize(16),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scaleSize(100),
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  sendCodeButtonText: {
    color: '#fff',
    fontSize: scaleSize(14),
    fontWeight: '600',
  },
  submitButton: {
    height: scaleSize(50),
    backgroundColor: '#000000',
    borderRadius: scaleSize(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSize(10),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: scaleSize(16),
    fontWeight: '600',
  },
  // TODO: 上线前移除调试功能样式
  debugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: scaleSize(20),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    backgroundColor: '#FFF3CD',
    borderRadius: scaleSize(8),
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  debugLabel: {
    fontSize: scaleSize(14),
    color: '#856404',
    fontWeight: '500',
  },
});

