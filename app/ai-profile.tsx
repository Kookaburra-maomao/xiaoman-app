/**
 * 小满性格设置页面
 */

import Toast from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';
import { getAiProfile, updateAiProfile } from '@/services/chatService';
import { saveJwtUser } from '@/utils/jwtAuth';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BACK_ICON = 'http://xiaomanriji.com/api/files/xiaoman-calander-prev.png';

const CHAT_OPTIONS = [
  { key: 'NORMAL', title: '标准', desc: '倾听者，贴心回应，温和追问' },
  { key: 'LITE', title: '极简', desc: '记录员，简短应答，惜字如金' },
  { key: 'MAX', title: '健谈', desc: '聊天搭子，热情话痨，尽兴畅谈' },
];

const DIARY_OPTIONS = [
  { key: 'NORMAL', title: '标准', desc: '尊重事实，暖心正向，适当总结升华' },
  { key: 'LITE', title: '直白记录', desc: '照搬原话，保留语气，只排版不加工' },
];

export default function AiProfileScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [chatProfile, setChatProfile] = useState('NORMAL');
  const [diaryProfile, setDiaryProfile] = useState('NORMAL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    // 优先从本地 user 对象读取（保存时已同步）
    if (user.chat_profile) setChatProfile(user.chat_profile);
    if (user.diary_profile) setDiaryProfile(user.diary_profile);
    // 同时从接口获取最新值
    getAiProfile(user.id).then((data) => {
      if (data.chat_profile) setChatProfile(data.chat_profile);
      if (data.diary_profile) setDiaryProfile(data.diary_profile);
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const handleSelect = async (type: 'chat' | 'diary', key: string) => {
    if (!user?.id) return;
    const prev = type === 'chat' ? chatProfile : diaryProfile;
    if (key === prev) return;

    if (type === 'chat') setChatProfile(key);
    else setDiaryProfile(key);

    try {
      setSaving(true);
      await updateAiProfile({
        userId: user.id,
        ...(type === 'chat' ? { chat_profile: key } : { diary_profile: key }),
      });
      // 同步更新本地 user 对象并持久化
      if (user) {
        const updatedUser = { ...user };
        if (type === 'chat') updatedUser.chat_profile = key;
        else updatedUser.diary_profile = key;
        setUser(updatedUser);
        await saveJwtUser(updatedUser);
      }
      setToastMessage('设置已保存');
      setToastVisible(true);
    } catch {
      // 回滚
      if (type === 'chat') setChatProfile(prev);
      else setDiaryProfile(prev);
      setToastMessage('保存失败，请重试');
      setToastVisible(true);
    } finally {
      setSaving(false);
    }
  };

  const renderOption = (
    option: { key: string; title: string; desc: string },
    selected: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={option.key}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={saving}
    >
      <View style={styles.optionRow}>
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Text style={styles.checkmark} allowFontScaling={false}>✓</Text>}
        </View>
        <View style={styles.optionTextWrap}>
          <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]} allowFontScaling={false}>{option.title}</Text>
          <Text style={styles.optionDesc} allowFontScaling={false}>{option.desc}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar hidden />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#999" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={{ uri: BACK_ICON }} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>小满性格设置</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle} allowFontScaling={false}>小满对话风格：</Text>
        {CHAT_OPTIONS.map((opt) => renderOption(opt, chatProfile === opt.key, () => handleSelect('chat', opt.key)))}

        <Text style={[styles.sectionTitle, { marginTop: scaleSize(32) }]} allowFontScaling={false}>日记风格：</Text>
        {DIARY_OPTIONS.map((opt) => renderOption(opt, diaryProfile === opt.key, () => handleSelect('diary', opt.key)))}

        <View style={{ height: scaleSize(40) }} />
      </ScrollView>

      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16), paddingVertical: scaleSize(12), backgroundColor: '#F5F5F5',
  },
  backButton: { width: scaleSize(40), height: scaleSize(40), justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: scaleSize(40), height: scaleSize(40) },
  headerTitle: { fontSize: scaleSize(16), fontWeight: '600', color: '#222222' },
  scrollView: { flex: 1, paddingHorizontal: scaleSize(20) },
  sectionTitle: {
    fontSize: scaleSize(18), fontWeight: '600', color: '#222222',
    marginTop: scaleSize(24), marginBottom: scaleSize(16),
  },
  optionCard: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: scaleSize(12),
    paddingVertical: scaleSize(16), paddingHorizontal: scaleSize(16),
    marginBottom: scaleSize(12), backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: '#222222', borderWidth: 1.5,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: scaleSize(22), height: scaleSize(22), borderRadius: scaleSize(4),
    borderWidth: 1.5, borderColor: '#CCCCCC', justifyContent: 'center', alignItems: 'center',
    marginRight: scaleSize(12),
  },
  checkboxSelected: {
    backgroundColor: '#222222', borderColor: '#222222',
  },
  checkmark: { fontSize: scaleSize(14), color: '#FFFFFF', fontWeight: '600' },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: scaleSize(16), fontWeight: '600', color: '#222222', marginBottom: scaleSize(4) },
  optionTitleSelected: { color: '#222222' },
  optionDesc: { fontSize: scaleSize(13), color: '#888888', lineHeight: scaleSize(20) },
});
