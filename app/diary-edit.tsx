import DateTimePickerModal from '@/components/common/DateTimePickerModal';
import Toast from '@/components/common/Toast';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { DiaryDetail, getDiaryDetail, saveDiary, updateDiary } from '@/services/chatService';
import * as imageService from '@/services/imageService';
import { scaleSize } from '@/utils/screen';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions,
  Image, KeyboardAvoidingView, Modal,
  Platform, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
const RETURN_ICON = 'http://xiaomanriji.com/api/files/xiaoman-top-return.png';
const UPLOAD_ICON = 'http://xiaomanriji.com/api/files/xiaoman-image-upload-icon.png';
const DELETE_ICON = 'http://xiaomanriji.com/api/files/xiaoman-image-delete.png';
const TOP_ICON = 'http://xiaomanriji.com/api/files/xiaoman-image-top.png';
const BACK_ICON = 'http://xiaomanriji.com/api/files/xiaoman-calander-prev.png';

const parseImages = (pic?: string | null): string[] => {
  if (!pic || pic.trim() === '') return [];
  try {
    const parsed = JSON.parse(pic);
    if (Array.isArray(parsed)) return parsed.filter(img => typeof img === 'string' && img.trim() !== '');
  } catch { return pic.split(',').map(img => img.trim()).filter(Boolean); }
  return [];
};

const resolveUri = (uri: string) => uri.startsWith('http') ? uri : `${apiUrl}${uri}`;

const formatDateTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const w = weekdays[date.getDay()];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} 星期${w} ${hh}:${mm}`;
};

export default function DiaryEditScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { diaryId, mode, defaultDate } = useLocalSearchParams<{ diaryId: string; mode: string; defaultDate: string }>();
  const isCreateMode = mode === 'create';
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [context, setContext] = useState('');
  const [weather, setWeather] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState(() => {
    if (defaultDate) {
      const now = new Date();
      // 如果只是日期格式（如 2026-04-04），拼上当前时分
      if (/^\d{4}-\d{2}-\d{2}$/.test(defaultDate)) {
        const [y, m, d] = defaultDate.split('-').map(Number);
        return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), 0);
      }
      const d = new Date(defaultDate);
      return isNaN(d.getTime()) ? now : d;
    }
    return new Date();
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isCreateMode || !diaryId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getDiaryDetail(diaryId);
        if (data) {
          setDiary(data);
          setContext(data.context);
          setWeather(data.weather || '');
          setLocation(data.city || '');
          setDateTime(new Date(data.gmt_create));
          setImages(parseImages(data.pic));
        }
      } catch (error) {
        Alert.alert('错误', '获取日记详情失败');
        router.back();
      } finally { setLoading(false); }
    })();
  }, [diaryId]);

  const handlePickImage = async () => {
    if (images.length >= 3) { Alert.alert('提示', '最多支持3张图片'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    try {
      setUploading(true);
      const { convertHeicToJpeg } = await import('@/utils/imageConverter');
      const converted = await convertHeicToJpeg(result.assets[0].uri);
      const uploadResult = await imageService.uploadImage(converted);
      let url = uploadResult.url;
      if (url && url.includes('xiaomanriji')) {
        url = url.replace(/^https?:\/\/[^/]*xiaomanriji[^/]*/, '');
      }
      setImages(prev => [...prev, url]);
    } catch (e: any) {
      Alert.alert('错误', e.message || '上传图片失败');
    } finally { setUploading(false); }
  };

  const handleDeleteImage = (index: number) => {
    Alert.alert('确认删除', '确定要删除这张图片吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确认', style: 'destructive', onPress: () => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setPreviewIndex(null);
      }},
    ]);
  };

  const handleSetFirst = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
      return arr;
    });
    setPreviewIndex(0);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!isCreateMode && !diaryId) return;
    if (!context.trim()) { Alert.alert('提示', '日记内容不能为空'); return; }
    if (weather.length > 32) { setToastMessage('天气不能超过32个字符'); setToastVisible(true); return; }
    if (location.length > 32) { setToastMessage('位置不能超过32个字符'); setToastVisible(true); return; }
    try {
      setSaving(true);
      const picJson = images.length > 0 ? JSON.stringify(images) : '';
      if (isCreateMode) {
        // 新增日记
        await saveDiary(context.trim(), user.id, picJson, '', undefined, location, weather, dateTime.toISOString());
        Alert.alert('成功', '日记已创建', [{ text: '确定', onPress: () => router.back() }]);
      } else {
        // 编辑日记
        await updateDiary(diaryId!, context.trim(), user.id, picJson, weather, location, dateTime.toISOString());
        Alert.alert('成功', '日记已更新', [{ text: '确定', onPress: () => router.back() }]);
      }
    } catch (e: any) {
      Alert.alert('错误', e.message || '更新日记失败');
    } finally { setSaving(false); }
  };

  const handleBack = () => {
    if (isCreateMode) {
      if (context.trim() || images.length > 0) {
        Alert.alert('提示', '您有未保存的内容，确定要返回吗？', [
          { text: '继续编辑', style: 'cancel' },
          { text: '确定返回', onPress: () => router.back() },
        ]);
      } else { router.back(); }
    } else {
      const hasChanges = context !== diary?.context || weather !== (diary?.weather || '') || location !== (diary?.city || '');
      if (hasChanges) {
        Alert.alert('提示', '您有未保存的修改，确定要返回吗？', [
          { text: '继续编辑', style: 'cancel' },
          { text: '确定返回', onPress: () => router.back() },
        ]);
      } else { router.back(); }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar hidden />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!isCreateMode && !diary) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Image source={{ uri: RETURN_ICON }} style={styles.backIcon} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} allowFontScaling={false}>{isCreateMode ? '补写日记' : '编辑日记'}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 图片编辑区 */}
          <View style={styles.imageRow}>
            {images.map((uri, index) => (
              <TouchableOpacity key={index} onPress={() => setPreviewIndex(index)} activeOpacity={0.8}>
                <Image source={{ uri: resolveUri(uri) }} style={styles.imageThumb} resizeMode="cover" />
              </TouchableOpacity>
            ))}
            {images.length < 3 && (
              <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} activeOpacity={0.7} disabled={uploading}>
                {uploading ? (
                  <ActivityIndicator size="small" color="#999" />
                ) : (
                  <Image source={{ uri: UPLOAD_ICON }} style={styles.uploadIcon} resizeMode="contain" />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* 日期 */}
          <Text style={styles.fieldLabel} allowFontScaling={false}>日期</Text>
          <TouchableOpacity style={styles.dateBox} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Text style={styles.dateText} allowFontScaling={false}>{formatDateTime(dateTime)}</Text>
            <Image source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-sort.png' }} style={styles.sortIcon} resizeMode="contain" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePickerModal
              visible={showDatePicker}
              value={dateTime}
              onConfirm={(date) => { setDateTime(date); setShowDatePicker(false); }}
              onCancel={() => setShowDatePicker(false)}
            />
          )}

          {/* 天气 */}
          <Text style={styles.fieldLabel} allowFontScaling={false}>天气</Text>
          <TextInput style={styles.fieldInput} value={weather} onChangeText={setWeather} placeholder="请输入天气" placeholderTextColor="#999" allowFontScaling={false} maxLength={32} />

          {/* 位置 */}
          <Text style={styles.fieldLabel} allowFontScaling={false}>位置</Text>
          <TextInput style={styles.fieldInput} value={location} onChangeText={setLocation} placeholder="请输入位置" placeholderTextColor="#999" allowFontScaling={false} maxLength={32} />

          {/* 日记正文 */}
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel} allowFontScaling={false}>日记</Text>
            <Text style={styles.fieldCount} allowFontScaling={false}>（{context.length}/2000）</Text>
          </View>
          <TextInput
            style={styles.contextInput}
            value={context}
            onChangeText={setContext}
            placeholder="请输入日记内容..."
            placeholderTextColor="#999"
            multiline
            textAlignVertical="top"
            allowFontScaling={false}
            maxLength={2000}
          />
        </ScrollView>

        {/* 完成并保存 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.7}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Image source={{ uri: TOP_ICON }} style={styles.saveIcon} resizeMode="contain" />
                <Text style={styles.saveText} allowFontScaling={false}>完成并保存</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 图片预览 Modal - 支持缩放 */}
      {previewIndex !== null && (
        <Modal visible={true} animationType="fade" transparent={false}>
          <View style={styles.previewContainer}>
            <TouchableOpacity style={styles.previewBack} onPress={() => setPreviewIndex(null)}>
              <Image source={{ uri: BACK_ICON }} style={styles.previewBackIcon} resizeMode="contain" />
            </TouchableOpacity>
            <ScrollView
              style={styles.previewScrollView}
              contentContainerStyle={styles.previewScrollContent}
              maximumZoomScale={5}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent={true}
              bouncesZoom={true}
            >
              <Image
                source={{ uri: resolveUri(images[previewIndex]) }}
                style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height * 0.7 }}
                resizeMode="contain"
              />
            </ScrollView>
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleDeleteImage(previewIndex)} activeOpacity={0.7}>
                <Image source={{ uri: DELETE_ICON }} style={styles.previewActionIcon} resizeMode="contain" />
                <Text style={styles.previewActionText} allowFontScaling={false}>删除图片</Text>
              </TouchableOpacity>
              {previewIndex === 0 ? (
                <LinearGradient colors={['#FF336C', '#FFC591']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.previewActionBtnGradient}>
                  <Image source={{ uri: TOP_ICON }} style={styles.previewActionIcon} resizeMode="contain" />
                  <Text style={styles.previewActionTextWhite} allowFontScaling={false}>设为日记首图</Text>
                </LinearGradient>
              ) : (
                <TouchableOpacity style={styles.previewActionBtn} onPress={() => handleSetFirst(previewIndex)} activeOpacity={0.7}>
                  <Image source={{ uri: TOP_ICON }} style={styles.previewActionIcon} resizeMode="contain" />
                  <Text style={styles.previewActionText} allowFontScaling={false}>设为日记首图</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}

      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16), paddingVertical: scaleSize(12),
  },
  backButton: { width: scaleSize(40), height: scaleSize(40), justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: scaleSize(40), height: scaleSize(40) },
  headerTitle: { fontSize: scaleSize(16), fontWeight: '600', color: '#222222' },
  scrollView: { flex: 1, paddingHorizontal: scaleSize(16) },
  // 图片区
  imageRow: { flexDirection: 'row', gap: scaleSize(8), marginTop: scaleSize(16), flexWrap: 'wrap' },
  imageThumb: { width: scaleSize(109), height: scaleSize(109), borderRadius: scaleSize(8) },
  uploadBox: {
    width: scaleSize(109), height: scaleSize(109), borderRadius: scaleSize(8),
    backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center',
  },
  uploadIcon: { width: scaleSize(24), height: scaleSize(24) },
  // 表单
  fieldLabel: { fontSize: scaleSize(14), color: '#666666', marginTop: scaleSize(16), marginBottom: scaleSize(8) },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: scaleSize(16), marginBottom: scaleSize(8) },
  fieldCount: { fontSize: scaleSize(12), color: '#999999', marginTop: scaleSize(10), marginLeft: scaleSize(4) },
  dateBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: scaleSize(44), borderWidth: 1, borderColor: '#000000', borderRadius: scaleSize(8),
    paddingVertical: scaleSize(9), paddingHorizontal: scaleSize(16),
  },
  dateText: { fontSize: scaleSize(14), color: '#222222' },
  sortIcon: { width: scaleSize(16), height: scaleSize(16) },
  fieldInput: {
    fontSize: scaleSize(14), color: '#222222', height: scaleSize(44),
    borderWidth: 1, borderColor: '#000000', borderRadius: scaleSize(8),
    paddingVertical: scaleSize(9), paddingHorizontal: scaleSize(16),
  },
  contextInput: {
    fontSize: scaleSize(14), color: '#222222', lineHeight: scaleSize(24),
    minHeight: scaleSize(200), borderWidth: 1, borderColor: '#000000', borderRadius: scaleSize(8),
    paddingVertical: scaleSize(9), paddingHorizontal: scaleSize(16),
  },
  // 底部保存
  bottomBar: { paddingHorizontal: scaleSize(16), paddingVertical: scaleSize(12), paddingBottom: scaleSize(24) },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: scaleSize(50), backgroundColor: '#000000', borderRadius: scaleSize(14),
  },
  saveIcon: { width: scaleSize(20), height: scaleSize(20), marginRight: scaleSize(8), tintColor: '#FFFFFF' },
  saveText: { fontSize: scaleSize(16), fontWeight: '600', color: '#FFFFFF' },
  // 图片预览
  previewContainer: { flex: 1, backgroundColor: '#000000' },
  previewBack: {
    position: 'absolute', top: scaleSize(60), left: scaleSize(16), zIndex: 10,
    width: scaleSize(40), height: scaleSize(40), borderRadius: scaleSize(20),
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  previewBackIcon: { width: scaleSize(24), height: scaleSize(24), tintColor: '#FFFFFF' },
  previewScrollView: { flex: 1 },
  previewScrollContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewActions: {
    position: 'absolute', bottom: scaleSize(40), left: scaleSize(16), right: scaleSize(16),
    flexDirection: 'row', gap: scaleSize(12),
  },
  previewActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: scaleSize(48), backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: scaleSize(12),
  },
  previewActionBtnGradient: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: scaleSize(48), borderRadius: scaleSize(12),
  },
  previewActionIcon: { width: scaleSize(20), height: scaleSize(20), marginRight: scaleSize(6), tintColor: '#FFFFFF' },
  previewActionText: { fontSize: scaleSize(14), color: '#FFFFFF' },
  previewActionTextWhite: { fontSize: scaleSize(14), color: '#FFFFFF', fontWeight: '600' },
});
