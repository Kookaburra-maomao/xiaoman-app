import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DeletedDiaryItem, getDeletedDiaries, permanentDeleteDiary, restoreDiary } from '@/services/chatService';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 获取第一张图片
const getFirstImage = (pic?: string | null): string | null => {
  if (!pic || pic.trim() === '') return null;
  try {
    const parsed = JSON.parse(pic);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0];
      return typeof first === 'string' && first.trim() !== '' ? first.trim() : null;
    }
  } catch {
    const images = pic.split(',').map(img => img.trim()).filter(Boolean);
    return images.length > 0 ? images[0] : null;
  }
  return null;
};

// 截取前100个字符
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 计算剩余天数
const calculateRemainingDays = (deleteTime: string): number => {
  const deleteDate = new Date(deleteTime);
  const expiryDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 删除时间 + 30天
  const now = new Date();
  const remainingMs = expiryDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return Math.max(0, remainingDays);
};

// 格式化删除时间
const formatDeleteTime = (deleteTime: string): string => {
  const date = new Date(deleteTime);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

export default function DiaryRecycleBinScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [diaries, setDiaries] = useState<DeletedDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 获取已删除日记列表
  const fetchDeletedDiaries = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getDeletedDiaries(user.id);
      // 按删除时间倒序排列
      data.sort((a, b) => new Date(b.gmt_delete).getTime() - new Date(a.gmt_delete).getTime());
      setDiaries(data);
    } catch (error) {
      console.error('获取已删除日记失败:', error);
      Alert.alert('错误', '获取已删除日记失败，请重试');
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  // 恢复日记
  const handleRestoreDiary = async (diaryId: string) => {
    Alert.alert(
      '恢复日记',
      '确定要恢复这篇日记吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '恢复',
          onPress: async () => {
            try {
              setRestoringId(diaryId);
              await restoreDiary(diaryId);
              Alert.alert('成功', '日记已恢复');
              // 刷新列表
              await fetchDeletedDiaries();
            } catch (error: any) {
              console.error('恢复日记失败:', error);
              Alert.alert('错误', error.message || '恢复日记失败，请重试');
            } finally {
              setRestoringId(null);
            }
          },
        },
      ]
    );
  };

  // 彻底删除日记
  const handlePermanentDelete = async (diaryId: string) => {
    if (!user?.id) return;

    Alert.alert(
      '彻底删除',
      '彻底删除后将无法恢复，确定要删除吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(diaryId);
              await permanentDeleteDiary(diaryId, user.id);
              Alert.alert('成功', '日记已彻底删除');
              // 刷新列表
              await fetchDeletedDiaries();
            } catch (error: any) {
              console.error('彻底删除日记失败:', error);
              Alert.alert('错误', error.message || '彻底删除日记失败，请重试');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchDeletedDiaries();
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日记回收站</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trash-bin-outline" size={64} color={Colors.light.icon} />
          <Text style={styles.emptyText}>回收站是空的</Text>
          <Text style={styles.emptySubText}>已删除的日记会在这里保留30天</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.timelineContainer}>
            {diaries.map((diary, index) => {
              const remainingDays = calculateRemainingDays(diary.gmt_delete);
              const firstImage = getFirstImage(diary.pic);
              
              return (
                <View key={diary.id} style={styles.timelineItem}>
                  {/* 时间轴左侧 */}
                  <View style={styles.timelineLeft}>
                    <View style={styles.timeContainer}>
                      <Text style={styles.deleteTimeText}>
                        {formatDeleteTime(diary.gmt_delete)}
                      </Text>
                      <Text style={styles.remainingDaysText}>
                        {remainingDays}天后删除
                      </Text>
                    </View>
                    <View style={styles.timelineDot} />
                    {index < diaries.length - 1 && <View style={styles.timelineLine} />}
                  </View>

                  {/* 内容区域 */}
                  <View style={styles.timelineContent}>
                    <View style={styles.diaryCard}>
                      {/* 图片 */}
                      {firstImage && (
                        <Image
                          source={{
                            uri: firstImage.startsWith('http')
                              ? firstImage
                              : `${apiUrl}${firstImage}`,
                          }}
                          style={styles.diaryImage}
                          resizeMode="cover"
                        />
                      )}

                      {/* 文字内容 - 使用 Markdown 渲染 */}
                      {diary.context && (
                        <View style={styles.diaryTextContainer}>
                          <Markdown style={defaultMarkdownStyles}>
                            {truncateText(diary.context)}
                          </Markdown>
                        </View>
                      )}

                      {/* 操作按钮 */}
                      <View style={styles.buttonContainer}>
                        {/* 恢复按钮 */}
                        <TouchableOpacity
                          style={[
                            styles.restoreButton,
                            restoringId === diary.id && styles.restoreButtonDisabled,
                          ]}
                          onPress={() => handleRestoreDiary(diary.id)}
                          disabled={restoringId === diary.id || deletingId === diary.id}
                          activeOpacity={0.7}
                        >
                          {restoringId === diary.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="refresh" size={16} color="#FFFFFF" />
                              <Text style={styles.restoreButtonText}>恢复日记</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        {/* 彻底删除按钮 */}
                        <TouchableOpacity
                          style={[
                            styles.deleteButton,
                            deletingId === diary.id && styles.deleteButtonDisabled,
                          ]}
                          onPress={() => handlePermanentDelete(diary.id)}
                          disabled={deletingId === diary.id || restoringId === diary.id}
                          activeOpacity={0.7}
                        >
                          {deletingId === diary.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="trash" size={16} color="#FFFFFF" />
                              <Text style={styles.deleteButtonText}>彻底删除</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
    borderBottomColor: '#E5E5E5',
    backgroundColor: Colors.light.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  timelineContainer: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    width: 80,
    alignItems: 'center',
    marginRight: 12,
  },
  timeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteTimeText: {
    fontSize: 12,
    color: Colors.light.text,
    textAlign: 'center',
  },
  remainingDaysText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    fontWeight: '600',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#E5E5E5',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  diaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  diaryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  diaryTextContainer: {
    marginBottom: 16,
  },
  diaryText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(98),
    height: scaleSize(34),
    paddingLeft: scaleSize(16),
    paddingRight: scaleSize(12),
    backgroundColor: '#000000',
    borderRadius: scaleSize(10),
  },
  restoreButtonDisabled: {
    opacity: 0.6,
  },
  restoreButtonText: {
    color: '#FFFFFF',
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    fontWeight: '400',
    fontFamily: 'PingFang SC',
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(98),
    height: scaleSize(34),
    paddingLeft: scaleSize(16),
    paddingRight: scaleSize(12),
    backgroundColor: 'rgb(235, 71, 106)',
    borderRadius: scaleSize(10),
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    fontWeight: '400',
    fontFamily: 'PingFang SC',
    marginLeft: 4,
  },
});
