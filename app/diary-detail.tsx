import ShareModal from '@/components/diary/ShareModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { deleteDiary, DiaryDetail, getDiaryDetail } from '@/services/chatService';
import * as imageService from '@/services/imageService';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 解析图片列表（支持逗号分隔的多张图片）
const parseImages = (pic?: string | null): string[] => {
  if (!pic) return [];
  return pic.split(',').map(img => img.trim()).filter(img => img);
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [localScreenshotUri, setLocalScreenshotUri] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const imageScrollViewRef = useRef<ScrollView>(null);
  const contentViewRef = useRef<ViewShot>(null);

  const images = diary ? parseImages(diary.pic) : [];

  // 获取日记详情
  const fetchDiaryDetail = async () => {
    if (!diaryId) return;

    try {
      setLoading(true);
      const data = await getDiaryDetail(diaryId);
      setDiary(data);
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

  // 页面聚焦时刷新数据（从编辑页面返回时）
  useFocusEffect(
    useCallback(() => {
      if (diaryId) {
        fetchDiaryDetail();
      }
    }, [diaryId])
  );

  // 处理图片滚动
  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

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

  // 处理分享 - 截图并上传
  const handleShare = async () => {
    if (!contentViewRef.current || !diary) {
      return;
    }

    try {
      setSharing(true);

      // 滚动到顶部，确保从开始截图
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }

      // 等待内容渲染和滚动完成
      await new Promise(resolve => setTimeout(resolve, 500));

      // 截图整个内容区域（包括超出屏幕的部分）
      if (!contentViewRef.current || !contentViewRef.current.capture) {
        throw new Error('ViewShot ref not available');
      }
      const uri = await contentViewRef.current.capture();

      // 保存本地URI用于保存到相册
      setLocalScreenshotUri(uri);

      // 上传截图
      const uploadResult = await imageService.uploadImage(uri);
      setScreenshotUri(uploadResult.url);

      // 显示分享弹窗
      setShowShareModal(true);
    } catch (error: any) {
      console.error('截图或上传失败:', error);
      Alert.alert('错误', error.message || '截图失败，请重试');
    } finally {
      setSharing(false);
    }
  };

  // 保存图片到相册
  const handleSaveImage = async () => {
    if (!localScreenshotUri) {
      Alert.alert('提示', '图片未准备好');
      return;
    }

    try {
      // 请求相册权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能保存图片');
        return;
      }

      // 保存到相册（使用本地截图URI）
      await MediaLibrary.createAssetAsync(localScreenshotUri);
      
      Alert.alert('成功', '图片已保存到相册');
    } catch (error: any) {
      console.error('保存图片失败:', error);
      Alert.alert('错误', error.message || '保存图片失败，请重试');
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
        {/* 日记信息卡片 - 用于截图 */}
        <ViewShot
          ref={contentViewRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={styles.contentView}
        >
          <View style={styles.infoCard}>
            {/* 日期显示 */}
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>Date {formatDate(diary.gmt_create)}</Text>
            </View>

            {/* 图片列表 - 横滑展示 */}
            {images.length > 0 && (
              <View style={styles.imageContainer}>
              <ScrollView
                ref={imageScrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleImageScroll}
                scrollEventThrottle={16}
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
                
                {/* 图片指示器 */}
                {images.length > 1 && (
                  <View style={styles.indicatorContainer}>
                    {images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.indicator,
                          index === currentImageIndex && styles.indicatorActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
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
        </ViewShot>

        {/* 操作按钮 */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              router.push(`/diary-edit?diaryId=${diary.id}` as any);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color={Colors.light.text} />
            <Text style={styles.actionButtonText}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.7}
          >
            {sharing ? (
              <ActivityIndicator size="small" color={Colors.light.text} />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color={Colors.light.text} />
                <Text style={styles.actionButtonText}>分享</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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

      {/* 分享弹窗 */}
      <ShareModal
        visible={showShareModal}
        imageUri={screenshotUri || undefined}
        onClose={() => setShowShareModal(false)}
        onSaveImage={handleSaveImage}
      />
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
    borderBottomWidth: 1,
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
    top: 68,
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
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  imageContainer: {
    marginTop: 8,
    marginHorizontal: -16,
    overflow: 'hidden',
  },
  imageScrollView: {
    height: SCREEN_WIDTH - 32, // 屏幕宽度减去左右margin(16*2)
  },
  diaryImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
  },
  indicatorActive: {
    backgroundColor: Colors.light.tint,
    width: 8,
    height: 8,
    borderRadius: 4,
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.text,
    minWidth: 100,
  },
  actionButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
    marginLeft: 8,
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

