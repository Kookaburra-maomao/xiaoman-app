/**
 * 日记加密设置弹窗
 * 支持：设置密码、验证密码、重置密码（短信验证码）
 */

import { scaleSize } from "@/utils/screen";
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

type ModalMode = 'set' | 'verify' | 'reset-sms' | 'reset-password';

interface DiaryEncryptionModalProps {
  visible: boolean;
  mode: 'set' | 'verify'; // set=设置密码, verify=验证密码
  userId: string;
  phone?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DiaryEncryptionModal({
  visible, mode: initialMode, userId, phone, onClose, onSuccess,
}: DiaryEncryptionModalProps) {
  const [currentMode, setCurrentMode] = useState<ModalMode>(initialMode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      setCurrentMode(initialMode);
      setPassword('');
      setConfirmPassword('');
      setSmsCode('');
      setError('');
    }
  }, [visible, initialMode]);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => setCountdown(p => p - 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [countdown > 0]);

  // 设置密码
  const handleSetPassword = async () => {
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      setError('请输入4位数字密码'); return;
    }
    if (currentMode === 'set' && password !== confirmPassword) {
      setError('两次密码不一致'); return;
    }
    try {
      setLoading(true);
      const url = `${apiUrl}/api/users/${userId}`;
      const body = { diary_password: password, diary_secret: 'true' };
      console.log('[DiaryEncryption] 设置密码请求:', url, JSON.stringify(body));
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      console.log('[DiaryEncryption] 设置密码响应:', res.status, text);
      const result = JSON.parse(text);
      if (result.code !== 200) throw new Error(result.message || '设置失败');
      onSuccess();
    } catch (e: any) {
      setError(e.message || '设置失败');
    } finally { setLoading(false); }
  };

  // 验证密码（关闭加密）
  const handleVerifyPassword = async () => {
    if (password.length !== 4) { setError('请输入4位密码'); return; }
    try {
      setLoading(true);
      const url = `${apiUrl}/api/users/verify-diary-password`;
      const body = { userId, diary_password: password };
      console.log('[DiaryEncryption] 验证密码请求:', url, JSON.stringify(body));
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      console.log('[DiaryEncryption] 验证密码响应:', res.status, text);
      if (!res.ok) {
        setError('密码错误，请重试');
        return;
      }
      let result;
      try { result = JSON.parse(text); } catch { setError('密码错误，请重试'); return; }
      if (result.code === 200 && result.data?.verified) {
        await fetch(`${apiUrl}/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diary_secret: 'false' }),
        });
        onSuccess();
      } else {
        setError('密码错误，请重试');
      }
    } catch {
      setError('验证失败，请重试');
    } finally { setLoading(false); }
  };

  // 发送验证码
  const handleSendSms = async () => {
    if (!phone) { Alert.alert('提示', '未绑定手机号'); return; }
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/sms/send?phone=${phone}`);
      const result = await res.json();
      if (result.code === 200) {
        setCountdown(60);
        setError('');
      } else { setError(result.message || '发送失败'); }
    } catch { setError('发送失败'); }
    finally { setLoading(false); }
  };

  // 校验验证码
  const handleVerifySms = async () => {
    if (smsCode.length !== 4) { setError('请输入4位验证码'); return; }
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/sms/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, VerifyCode: smsCode }),
      });
      const result = await res.json();
      if (result.code === 200 && result.data?.verified) {
        setCurrentMode('reset-password');
        setPassword('');
        setConfirmPassword('');
        setError('');
      } else { setError('验证码错误'); }
    } catch { setError('验证失败'); }
    finally { setLoading(false); }
  };

  const renderContent = () => {
    switch (currentMode) {
      case 'set':
      case 'reset-password':
        return (
          <>
            <Text style={styles.title} allowFontScaling={false}>
              {currentMode === 'set' ? '设置日记密码' : '重新设置密码'}
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>请设置4位数字密码</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              placeholder="输入密码" keyboardType="number-pad" maxLength={4} secureTextEntry allowFontScaling={false} />
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword}
              placeholder="确认密码" keyboardType="number-pad" maxLength={4} secureTextEntry allowFontScaling={false} />
            {error ? <Text style={styles.error} allowFontScaling={false}>{error}</Text> : null}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSetPassword} disabled={loading} activeOpacity={0.7}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText} allowFontScaling={false}>确认</Text>}
            </TouchableOpacity>
          </>
        );
      case 'verify':
        return (
          <>
            <Text style={styles.title} allowFontScaling={false}>输入日记密码</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>请输入4位数字密码以关闭加密</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword}
              placeholder="输入密码" keyboardType="number-pad" maxLength={4} secureTextEntry allowFontScaling={false} />
            {error ? <Text style={styles.error} allowFontScaling={false}>{error}</Text> : null}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyPassword} disabled={loading} activeOpacity={0.7}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText} allowFontScaling={false}>确认</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setCurrentMode('reset-sms'); setError(''); setSmsCode(''); }} activeOpacity={0.7}>
              <Text style={styles.resetLink} allowFontScaling={false}>忘记密码？重置密码</Text>
            </TouchableOpacity>
          </>
        );
      case 'reset-sms':
        return (
          <>
            <Text style={styles.title} allowFontScaling={false}>重置密码</Text>
            <Text style={styles.subtitle} allowFontScaling={false}>验证码将发送至 {phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</Text>
            <View style={styles.smsRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={smsCode} onChangeText={setSmsCode}
                placeholder="验证码" keyboardType="number-pad" maxLength={4} allowFontScaling={false} />
              <TouchableOpacity style={[styles.smsBtn, countdown > 0 && styles.smsBtnDisabled]}
                onPress={handleSendSms} disabled={countdown > 0 || loading} activeOpacity={0.7}>
                <Text style={styles.smsBtnText} allowFontScaling={false}>{countdown > 0 ? `${countdown}s` : '发送验证码'}</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error} allowFontScaling={false}>{error}</Text> : null}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifySms} disabled={loading} activeOpacity={0.7}>
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.primaryBtnText} allowFontScaling={false}>验证</Text>}
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText} allowFontScaling={false}>✕</Text>
          </TouchableOpacity>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: {
    width: scaleSize(320), backgroundColor: '#FFFFFF', borderRadius: scaleSize(20),
    padding: scaleSize(24), position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: scaleSize(12), right: scaleSize(16), zIndex: 1,
    width: scaleSize(30), height: scaleSize(30), justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { fontSize: scaleSize(18), color: '#999' },
  title: { fontSize: scaleSize(18), fontWeight: '600', color: '#222', marginBottom: scaleSize(8), textAlign: 'center' },
  subtitle: { fontSize: scaleSize(13), color: '#888', marginBottom: scaleSize(20), textAlign: 'center' },
  input: {
    height: scaleSize(48), borderWidth: 1, borderColor: '#E0E0E0', borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(16), fontSize: scaleSize(16), color: '#222', marginBottom: scaleSize(12),
    textAlign: 'center', letterSpacing: scaleSize(8),
  },
  error: { fontSize: scaleSize(12), color: '#FF4444', textAlign: 'center', marginBottom: scaleSize(12) },
  primaryBtn: {
    height: scaleSize(48), backgroundColor: '#000', borderRadius: scaleSize(12),
    justifyContent: 'center', alignItems: 'center', marginTop: scaleSize(4),
  },
  primaryBtnText: { fontSize: scaleSize(16), fontWeight: '600', color: '#FFF' },
  resetLink: { fontSize: scaleSize(13), color: '#666', textAlign: 'center', marginTop: scaleSize(16), textDecorationLine: 'underline' },
  smsRow: { flexDirection: 'row', gap: scaleSize(8), marginBottom: scaleSize(12) },
  smsBtn: {
    height: scaleSize(48), paddingHorizontal: scaleSize(14), backgroundColor: '#222',
    borderRadius: scaleSize(10), justifyContent: 'center', alignItems: 'center',
  },
  smsBtnDisabled: { backgroundColor: '#CCC' },
  smsBtnText: { fontSize: scaleSize(13), color: '#FFF' },
});
