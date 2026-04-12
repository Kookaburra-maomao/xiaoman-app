import DiaryActionButtons from '@/components/diary/DiaryActionButtons';
import DiaryCardContent from '@/components/diary/DiaryCardContent';
import DiaryImageCarousel from '@/components/diary/DiaryImageCarousel';
import DiaryStylePicker from '@/components/diary/DiaryStylePicker';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { deleteDiary, DiaryDetail, DiaryTemplate, generateBeautifiedDiary, getDiaryDetail, getDiaryTemplateLogs, getTodayBeautifyCount, recordTemplateUse, TemplateLogItem } from '@/services/chatService';
import { scaleSize } from '@/utils/screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as MediaLibrary from 'expo-media-library';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 图标URL
const RETURN_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-top-return.png';
const MENU_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-diary-menu.png';

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
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [beautifyCount, setBeautifyCount] = useState(0);
  const [templateLogs, setTemplateLogs] = useState<TemplateLogItem[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 判断是否为 VIP 用户
  const isVip = (user?.is_vip || '').toString() === '1' && user?.vip_expire_time && new Date(user.vip_expire_time).getTime() > Date.now();
  // 获取日记详情
  const fetchDiaryDetail = async () => {
    if (!diaryId) return;

    try {
      setLoading(true);
      const data = await getDiaryDetail(diaryId);
      if (data) {
        console.log('获取日记详情:', { diaryId, data, pic: data.pic });
        setDiary(data);
      }
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
    if (user?.id) {
      getTodayBeautifyCount(user.id).then(setBeautifyCount).catch(() => {});
      if (diaryId) {
        getDiaryTemplateLogs(user.id, diaryId).then(setTemplateLogs).catch(() => {});
      }
    }
  }, [diaryId]);

  // 页面聚焦时刷新数据（从编辑页面返回时）
  useFocusEffect(
    useCallback(() => {
      if (diaryId) {
        fetchDiaryDetail();
        if (user?.id) {
          getDiaryTemplateLogs(user.id, diaryId).then(setTemplateLogs).catch(() => {});
          getTodayBeautifyCount(user.id).then(setBeautifyCount).catch(() => {});
        }
      }
    }, [diaryId, user?.id])
  );

  // 处理删除
  const handleDelete = async () => {
    if (!diaryId || !user?.id) return;

    try {
      setDeleting(true);
      // 删除日记并获取当天更新后的日记列表
      const updatedDiaries = await deleteDiary(diaryId, user.id);
      
      // 设置刷新标记，通知聊天页面需要刷新
      await AsyncStorage.setItem('@chat_needs_refresh', 'true');
      
      Alert.alert('成功', '日记已删除', [
        {
          text: '确定',
          onPress: () => {
            // 返回到聊天页面，触发刷新
            router.back();
          },
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

  // 美化日记
  const handleBeautify = async (template: DiaryTemplate) => {
    if (!diary || !user?.id) return;
    // 检查今日美化次数（VIP 用户无限制）
    if (!isVip && beautifyCount >= 5) {
      Alert.alert('提示', '每天只能生成5篇美化日记哦~');
      return;
    }

    setShowStylePicker(false);
    setIsBeautifying(true);

    // 异步统计模版使用次数（不阻塞主流程）
    recordTemplateUse(template.id);

    try {
      const pics = parseImages(diary.pic);
      const date = new Date(diary.gmt_create);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const html = await generateBeautifiedDiary({
        template_id: template.id,
        diary_content: diary.context,
        pics,
        city: diary.city || '',
        date: dateStr,
        weather: diary.weather || '',
      });

      // 跳转到 WebView 页面
      await AsyncStorage.setItem('@beautify_html', html);
      setBeautifyCount(prev => prev + 1);
      router.push(`/diary-beautify?diaryId=${diary.id}&templateId=${template.id}&userId=${user.id}` as any);
    } catch (e: any) {
      Alert.alert('错误', e.message || '美化日记失败');
    } finally {
      setIsBeautifying(false);
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
          <Image
            source={{ uri: RETURN_ICON_URL }}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>日记</Text>
        <TouchableOpacity
          onPress={() => setShowDeleteMenu(!showDeleteMenu)}
          style={styles.menuButton}
        >
          <Image
            source={{ uri: MENU_ICON_URL }}
            style={styles.menuIcon}
            resizeMode="contain"
          />
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
              <Text style={styles.deleteMenuText} allowFontScaling={false}>删除日记</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentView}>
          <DiaryCardContent
            date={formatDate(diary.gmt_create)}
            weather={diary.weather}
            weekdayTime={formatTime(diary.gmt_create)}
            province={diary.city?.split('·')[0]?.trim()}
            city={diary.city?.includes('·') ? diary.city.split('·')[1]?.trim() : diary.city}
            imageContent={images.length > 0 ? (
              <DiaryImageCarousel
                imageUrls={images}
                apiUrl={apiUrl}
                showIndicator={true}
              />
            ) : undefined}
            context={diary.context}
          />
        </View>

        {/* 美化日记图片列表 */}
        {templateLogs.length > 0 && (
          <View style={styles.templateSection}>
            <Image
              source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-icon-beauty-title.png' }}
              style={styles.templateTitle}
              resizeMode="contain"
            />
            <View style={styles.templateGrid}>
              {templateLogs.map((log) => {
                const imgUri = log.diary_image?.startsWith('http') ? log.diary_image : `${apiUrl}${log.diary_image}`;
                return (
                  <TouchableOpacity key={log.id} style={styles.templateCard} onPress={() => setPreviewImageUrl(imgUri)} activeOpacity={0.8}>
                    <Image source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-template-sticker.png' }} style={styles.stickerLeft} resizeMode="contain" />
                    <Image source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-template-sticker.png' }} style={styles.stickerRight} resizeMode="contain" />
                    <Image source={{ uri: imgUri }} style={styles.templateImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 操作按钮 - 编辑 + 美化日记 */}
        <DiaryActionButtons
          onEdit={() => router.push(`/diary-edit?diaryId=${diary.id}` as any)}
          onExport={() => setShowStylePicker(true)}
          exportLabel="美化日记"
          exportIcon="http://xiaomanriji.com/api/files/xiaoman-icon-beauty.png"
        />
      </ScrollView>

      {/* 日记风格选择浮层 */}
      <DiaryStylePicker
        visible={showStylePicker}
        onClose={() => setShowStylePicker(false)}
        onSelect={handleBeautify}
        todayCount={beautifyCount}
        isVip={!!isVip}
      />

      {/* 删除确认弹窗 */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle} allowFontScaling={false}>删除日记</Text>
            <Text style={styles.modalMessage} allowFontScaling={false}>
              删除后你可以在最近删除列表里查看，确认删除吗?
            </Text>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText} allowFontScaling={false}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText} allowFontScaling={false}>确认</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 美化日记 loading 浮层 */}
      {isBeautifying && (
        <View style={styles.beautifyOverlay}>
          <LottieView
            source={require('@/assets/animations/beautify-loading.json')}
            autoPlay
            loop
            style={styles.beautifyLottie}
          />
          <Text style={styles.beautifyLoadingText} allowFontScaling={false}>日记美化中，约30秒左右... 请不要退出app</Text>
        </View>
      )}

      {/* 图片预览 Modal */}
      {previewImageUrl && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewImageUrl(null)}>
          <View style={styles.imagePreviewOverlay}>
            <TouchableOpacity style={styles.imagePreviewClose} onPress={() => setPreviewImageUrl(null)}>
              <Text style={styles.imagePreviewCloseText} allowFontScaling={false}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              onLongPress={async () => {
                try {
                  setSavingImage(true);
                  const { status } = await MediaLibrary.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('提示', '需要相册权限才能保存图片');
                    return;
                  }
                  // 下载图片到临时目录
                  const { cacheDirectory, downloadAsync } = await import('expo-file-system/legacy');
                  const fileUri = (cacheDirectory || '') + 'beautify_' + Date.now() + '.png';
                  const download = await downloadAsync(previewImageUrl, fileUri);
                  await MediaLibrary.createAssetAsync(download.uri);
                  Alert.alert('成功', '图片已保存到相册');
                } catch (e: any) {
                  Alert.alert('错误', e.message || '保存失败');
                } finally {
                  setSavingImage(false);
                }
              }}
              style={styles.imagePreviewContent}
            >
              <Image source={{ uri: previewImageUrl }} style={styles.imagePreviewImage} resizeMode="contain" />
              {savingImage && (
                <View style={styles.imagePreviewSaving}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.imagePreviewHint} allowFontScaling={false}>长按图片保存到相册</Text>
          </View>
        </Modal>
      )}

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
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  menuButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
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
  dateWeatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  dateContainer: {
    alignItems: 'flex-start',
    display: 'flex',
    direction: 'inherit',
  },
  dateText: {
    fontSize: scaleSize(12),
    color: '#666666',
  },
  dateValue: {
    fontSize: scaleSize(12),
    color: '#222222',
  },
  weatherText: {
    fontSize: scaleSize(12),
    color: '#999999',
  },
  timeContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  timeText: {
    fontSize: scaleSize(18),
    color: '#222222',
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
  beautifyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241,241,241,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  beautifyLottie: {
    width: scaleSize(96),
    height: scaleSize(99),
  },
  beautifyLoadingText: {
    marginTop: scaleSize(32),
    fontSize: scaleSize(14),
    color: '#666666',
  },
  templateSection: {
    paddingHorizontal: scaleSize(26),
    marginTop: scaleSize(20),
    marginBottom: scaleSize(10),
  },
  templateTitle: {
    width: scaleSize(96),
    height: scaleSize(20),
    alignSelf: 'center',
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: scaleSize(30),
  },
  templateCard: {
    width: scaleSize(140),
    height: scaleSize(236),
    marginBottom: scaleSize(16),
    position: 'relative',
  },
  templateImage: {
    width: '100%',
    height: '100%',
    borderRadius: scaleSize(4),
  },
  stickerLeft: {
    position: 'absolute',
    top: scaleSize(-8),
    left: scaleSize(12),
    width: scaleSize(12),
    height: scaleSize(16),
    zIndex: 1,
  },
  stickerRight: {
    position: 'absolute',
    top: scaleSize(-8),
    right: scaleSize(12),
    width: scaleSize(12),
    height: scaleSize(16),
    zIndex: 1,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewClose: {
    position: 'absolute',
    top: scaleSize(60),
    right: scaleSize(20),
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(18),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imagePreviewCloseText: {
    fontSize: scaleSize(18),
    color: '#FFFFFF',
  },
  imagePreviewContent: {
    width: '90%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewImage: {
    width: '100%',
    height: '100%',
  },
  imagePreviewSaving: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewHint: {
    marginTop: scaleSize(20),
    fontSize: scaleSize(13),
    color: 'rgba(255,255,255,0.6)',
  },
});

