import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getDiaryDetail, updateDiary, DiaryDetail } from '@/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 解析图片列表（支持逗号分隔的多张图片）
const parseImages = (pic?: string | null): string[] => {
  if (!pic) return [];
  return pic.split(',').map(img => img.trim()).filter(img => img);
};

export default function DiaryEditScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState('');

  const images = diary ? parseImages(diary.pic) : [];

  // 获取日记详情
  const fetchDiaryDetail = async () => {
    if (!diaryId) return;

    try {
      setLoading(true);
      const data = await getDiaryDetail(diaryId);
      setDiary(data);
      setContext(data.context);
    } catch (error) {
      console.error('获取日记详情失败:', error);
      Alert.alert('错误', '获取日记详情失败，请重试');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaryDetail();
  }, [diaryId]);

  // 处理保存
  const handleSave = async () => {
    if (!diaryId || !user?.id) return;

    if (!context.trim()) {
      Alert.alert('提示', '日记内容不能为空');
      return;
    }

    try {
      setSaving(true);
      await updateDiary(diaryId, context.trim(), user.id);
      Alert.alert('成功', '日记已更新', [
        {
          text: '确定',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('更新日记失败:', error);
      Alert.alert('错误', error.message || '更新日记失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    if (context !== diary?.context) {
      Alert.alert('提示', '您有未保存的修改，确定要取消吗？', [
        {
          text: '继续编辑',
          style: 'cancel',
        },
        {
          text: '确定取消',
          onPress: () => router.back(),
        },
      ]);
    } else {
      router.back();
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

  if (!diary) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>编辑日记</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 图片展示（只读） */}
          {images.length > 0 && (
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageScrollView}
              >
                {images.map((imageUri, index) => {
                  const fullUri = imageUri.startsWith('http') ? imageUri : `${apiUrl}${imageUri}`;
                  return (
                    <Image
                      key={index}
                      source={{ uri: fullUri }}
                      style={styles.diaryImage}
                      resizeMode="cover"
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 编辑区域 */}
          <View style={styles.editContainer}>
            <TextInput
              style={styles.textInput}
              value={context}
              onChangeText={setContext}
              placeholder="请输入日记内容..."
              placeholderTextColor={Colors.light.icon}
              multiline
              textAlignVertical="top"
              autoFocus={false}
            />
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving || !context.trim()}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>保存</Text>
            )}
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageScrollView: {
    height: SCREEN_WIDTH - 32,
  },
  diaryImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
  },
  editContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.text,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.light.text,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

