import DiaryActionButtons from '@/components/diary/DiaryActionButtons';
import DiaryImageCarousel from '@/components/diary/DiaryImageCarousel';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { deleteDiary, DiaryDetail, getDiaryDetail } from '@/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 解析图片列表（支持JSON格式和逗号分隔的多张图片）
const parseImages = (pic?: string | null): string[] => {
  if (!pic || pic.trim() === '') return [];
  
  // 尝试解析JSON格式
  try {
    const parsed = JSON.parse(pic);
    if (Array.isArray(parsed)) {
      const result = parsed.filter(img => img && img.trim() !== '');
      console.log('解析JSON格式图片:', { pic, parsed, result });
      return result;
    }
  } catch (e) {
    // 如果不是JSON格式，按逗号分隔处理（兼容旧格式）
    const result = pic.split(',').map(img => img.trim()).filter(img => img);
    console.log('解析逗号分隔格式图片:', { pic, result });
    return result;
  }
  
  return [];
};

// 格式化日期显示
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// 格式化时间显示
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `星期${weekday} ${hours}:${minutes}`;
};

export default function DiaryDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 获取日记详情
  const fetchDiaryDetail = async () => {
    if (!diaryId) return;

    try {
      setLoading(true);
      const data = await getDiaryDetail(diaryId);
      console.log('获取日记详情:', { diaryId, data, pic: data.pic });
      setDiary(data);
    } catch (error) {
      console.error('获取日记详情失败:', error);
      Alert.alert('错误', '获取日记详情失败，请重试');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const images = diary ? parseImages(diary.pic) : [];
  console.log('解析后的图片列表:', { pic: diary?.pic, images, imagesLength: images.length });

  useEffect(() => {
    fetchDiaryDetail();
  }, [diaryId]);

  // 页面聚焦时刷新数据（从编辑页面返回时）
  useFocusEffect(
    useCallback(() => {
      if (diaryId) {
        fetchDiaryDetail();
      }
    }, [diaryId])
  );

  // 处理删除
  const handleDelete = async () => {
    if (!diaryId) return;

    try {
      setDeleting(true);
      await deleteDiary(diaryId);
      Alert.alert('成功', '日记已删除', [
        {
          text: '确定',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('删除日记失败:', error);
      Alert.alert('错误', error.message || '删除日记失败，请重试');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setShowDeleteMenu(false);
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
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日记</Text>
        <TouchableOpacity
          onPress={() => setShowDeleteMenu(!showDeleteMenu)}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-horizontal-circle" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      {/* 删除菜单气泡 */}
      {showDeleteMenu && (
        <>
          <TouchableOpacity
            style={styles.menuOverlay}
            activeOpacity={1}
            onPress={() => setShowDeleteMenu(false)}
          />
          <View style={styles.deleteMenuContainer}>
            <TouchableOpacity
              style={styles.deleteMenuItem}
              onPress={() => {
                setShowDeleteMenu(false);
                setShowDeleteModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteMenuText}>删除日记</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentView}>
          <View style={styles.infoCard}>
            {/* 日期显示 */}
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>Date {formatDate(diary.gmt_create)}</Text>
            </View>

            {/* 图片区域 - 与生成弹窗统一的轮播组件 */}
            {images.length > 0 && (
              <DiaryImageCarousel
                imageUrls={images}
                apiUrl={apiUrl}
                showIndicator={true}
              />
            )}

            {/* 时间戳 */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(diary.gmt_create)}</Text>
            </View>

            {/* 日记正文 */}
            {diary.context && (
              <View style={styles.textContainer}>
                <Text style={styles.diaryText}>{diary.context}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 操作按钮 - 分享跳转至分享页 */}
        <DiaryActionButtons
          onEdit={() => router.push(`/diary-edit?diaryId=${diary.id}` as any)}
          onExport={() => router.push(`/diary-share?diaryId=${diary.id}` as any)}
          exportLabel="分享"
        />
      </ScrollView>

      {/* 删除确认弹窗 */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>删除日记</Text>
            <Text style={styles.modalMessage}>
              删除后你可以在最近删除列表里查看，确认删除吗?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>确认</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
    borderBottomColor: '#E5E5E5',
    position: 'relative',
    zIndex: 1001,
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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  deleteMenuContainer: {
    position: 'absolute',
    top: 108,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
    minWidth: 120,
  },
  deleteMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deleteMenuText: {
    fontSize: 16,
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
  contentView: {
    backgroundColor: Colors.light.background,
    paddingBottom: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateContainer: {
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  timeContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  textContainer: {
    paddingTop: 16,
  },
  diaryText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
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
  confirmButton: {
    backgroundColor: Colors.light.text,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

