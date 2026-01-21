import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { autoRegisterByPhone, getUserByPhone, saveUser, sendSmsCode, verifySmsCode } from '@/utils/auth';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

    if (!trimmedCode || trimmedCode.length !== 4) {
      Alert.alert('提示', '请输入4位验证码');
      return;
    }

    try {
      setVerifying(true);
      
      // TODO: 上线前移除调试功能 - 调试模式下验证码9999直接通过
      if (debugMode && trimmedCode === '9999') {
        // 调试模式：跳过验证码验证，直接查询用户
        console.log('调试模式：跳过验证码验证');
      } else {
        // 1. 验证验证码
        await verifySmsCode(trimmedPhone, trimmedCode);
      }
      
      // 2. 通过手机号查询用户
      const user = await getUserByPhone(trimmedPhone);
      console.log("user", user);
      if (user) {
        // 用户已存在，登录成功
        // 保存用户信息到本地存储
        await saveUser(user);
        // 直接更新 AuthContext 状态（不依赖 refreshAuth，因为我们已经有了用户信息）
        setUser(user);
        // 等待状态更新完成
        await new Promise(resolve => setTimeout(resolve, 100));
        router.replace('/(tabs)/chat');
      } else {
        // 用户不存在，自动注册
        // autoRegisterByPhone 内部已经保存用户信息
        const newUser = await autoRegisterByPhone(trimmedPhone);
        // 直接更新 AuthContext 状态（不依赖 refreshAuth，因为我们已经有了用户信息）
        setUser(newUser);
        // 等待状态更新完成
        await new Promise(resolve => setTimeout(resolve, 100));
        // 注册成功后直接跳转
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
        <View style={styles.content}>
          <Text style={styles.title}>小满日记</Text>
          <Text style={styles.subtitle}>欢迎使用</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>手机号</Text>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="请输入手机号"
                  placeholderTextColor={Colors.light.icon}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                  editable={!sendingCode && !verifying}
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
                    <Text style={styles.sendCodeButtonText}>发送验证码</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>验证码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入4位验证码"
                placeholderTextColor={Colors.light.icon}
                value={verifyCode}
                onChangeText={setVerifyCode}
                keyboardType="number-pad"
                maxLength={4}
                editable={!verifying}
              />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneInput: {
    flex: 1,
  },
  sendCodeButton: {
    height: 50,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  sendCodeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    height: 50,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // TODO: 上线前移除调试功能样式
  debugContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  debugLabel: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
});

