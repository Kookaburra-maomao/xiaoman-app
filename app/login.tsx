import { Colors } from '@/constants/theme';
import { LOGO_URL, SLOGAN_URL } from '@/constants/urls';
import { useAuth } from '@/hooks/useAuth';
import { sendSmsCode } from '@/utils/auth';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const { login } = useAuth();

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

    // 固定测试账号：18610995540，直接提示使用固定验证码
    if (trimmedPhone === '18610995540') {
      Alert.alert('测试账号', '请输入验证码：5540');
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

  // 验证验证码并登录（使用 JWT）
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

    if (!agreedToTerms) {
      Alert.alert('提示', '请先同意隐私协议和服务条款');
      return;
    }

    try {
      setVerifying(true);

      // 直接使用 JWT 登录（服务器会自动验证验证码并注册新用户）
      // login 接口内部已经包含了验证码验证和用户注册逻辑
      await login(trimmedPhone, trimmedCode);
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/(tabs)/chat');
    } catch (error: any) {
      console.error('[Login] 登录失败:', error);
      Alert.alert('错误', error.message || '登录失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  // 打开链接
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('提示', '无法打开链接');
      }
    } catch (error) {
      console.error('打开链接失败:', error);
      Alert.alert('提示', '打开链接失败');
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
                placeholderTextColor="#CCCCCC"
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
                  placeholderTextColor="#CCCCCC"
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

            {/* 隐私协议和服务条款 */}
            <View style={styles.termsContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxBoxChecked]}>
                  {agreedToTerms && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
              </TouchableOpacity>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>同意</Text>
                <TouchableOpacity onPress={() => openLink('http://xiaomanriji.com/privacy')}>
                  <Text style={styles.termsLink}>《隐私协议》</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}>和</Text>
                <TouchableOpacity onPress={() => openLink('http://xiaomanriji.com/terms')}>
                  <Text style={styles.termsLink}>《服务条款》</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (verifying || !agreedToTerms) && styles.submitButtonDisabled]}
              onPress={handleVerify}
              disabled={verifying || !agreedToTerms}
            >
              {verifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>登录</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: Colors.light.highlight,
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
    height: scaleSize(55),
    backgroundColor: '#FAFAFA',
    borderRadius: scaleSize(14),
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#000000',
  },
  verifyCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: scaleSize(14),
    borderWidth: 1,
    borderColor: '#000',
    padding: scaleSize(2),
    gap: scaleSize(2),
  },
  verifyCodeInput: {
    flex: 1,
    height: scaleSize(46),
    backgroundColor: '#FAFAFA',
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
    color: Colors.light.text,
  },
  sendCodeButton: {
    height: scaleSize(40),
    backgroundColor: '#000000',
    borderRadius: scaleSize(12),
    paddingHorizontal: scaleSize(16),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: scaleSize(100),
    marginTop: scaleSize(5),
    marginBottom: scaleSize(5),
    marginRight: scaleSize(5),
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
    borderRadius: scaleSize(14),
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scaleSize(16),
    marginBottom: scaleSize(8),
  },
  checkbox: {
    marginRight: scaleSize(8),
  },
  checkboxBox: {
    width: scaleSize(18),
    height: scaleSize(18),
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: scaleSize(4),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  checkboxBoxChecked: {
    backgroundColor: '#000000',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: scaleSize(12),
    fontWeight: 'bold',
  },
  termsTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  termsText: {
    fontSize: scaleSize(12),
    color: '#666666',
  },
  termsLink: {
    fontSize: scaleSize(12),
    color: '#000000',
    textDecorationLine: 'underline',
    marginHorizontal: scaleSize(2),
  },
});

