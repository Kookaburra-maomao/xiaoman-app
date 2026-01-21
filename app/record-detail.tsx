import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryByDateItem, getDiariesByDate } from '@/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 获取第一张图片
const getFirstImage = (pic?: string | null): string | null => {
  if (!pic) return null;
  const images = pic.split(',').filter(img => img.trim());
  return images.length > 0 ? images[0].trim() : null;
};

// 截取前100个字符
const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export default function RecordDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [diaries, setDiaries] = useState<DiaryByDateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  // 格式化时间显示
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 格式化时间段显示（上午/下午）
  const formatTimePeriod = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = date.getHours();
    return hours < 12 ? '上午' : '下午';
  };

  // 获取日记列表
  const fetchDiaries = async () => {
    if (!user?.id || !date) return;

    try {
      setLoading(true);
      const data = await getDiariesByDate(user.id, date);
      // 按时间排序（从早到晚）
      data.sort((a, b) => new Date(a.gmt_create).getTime() - new Date(b.gmt_create).getTime());
      setDiaries(data);
    } catch (error) {
      console.error('获取日期日记失败:', error);
      setDiaries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiaries();
  }, [user?.id, date]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{date ? formatDate(date) : '日记详情'}</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : diaries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>这一天还没有日记</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.timelineContainer}>
            {diaries.map((diary, index) => (
              <View key={diary.id} style={styles.timelineItem}>
                {/* 时间轴左侧 */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timelineDot} />
                  {index < diaries.length - 1 && <View style={styles.timelineLine} />}
                </View>

                {/* 内容区域 */}
                <View style={styles.timelineContent}>
                  {/* 时间 */}
                  <View style={styles.timeContainer}>
                  <Text style={styles.timeText}>{formatTime(diary.gmt_create)}</Text>
                    <Text style={styles.timePeriodText}>{formatTimePeriod(diary.gmt_create)}</Text>
                  </View>

                  {/* 日记内容 */}
                  <View style={styles.diaryCard}>
                    {/* 图片 - 只显示第一张 */}
                    {(() => {
                      const firstImage = getFirstImage(diary.pic);
                      return firstImage ? (
                      <Image
                        source={{
                            uri: firstImage.startsWith('http')
                              ? firstImage
                              : `${apiUrl}${firstImage}`,
                        }}
                        style={styles.diaryImage}
                        resizeMode="cover"
                      />
                      ) : null;
                    })()}

                    {/* 文字内容 - 只显示前100个字 */}
                    {diary.context && (
                      <>
                        <Text style={styles.diaryText}>{truncateText(diary.context)}</Text>
                        {/* 如果文字超过100字，显示查看全文按钮 */}
                        {diary.context.length > 100 && (
                          <TouchableOpacity
                            style={styles.viewFullButton}
                            onPress={() => {
                              router.push({
                                pathname: '/diary-detail',
                                params: {
                                  diaryId: diary.id,
                                },
                              });
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.viewFullButtonText}>查看全文</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </View>
            ))}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
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
    width: 60,
    alignItems: 'flex-start',
    marginRight: 12,
    paddingTop: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
    marginLeft: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: 7,
    marginTop: 4,
    borderStyle: 'dashed',
  },
  timelineContent: {
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginRight: 8,
  },
  timePeriodText: {
    fontSize: 14,
    color: Colors.light.text,
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emojiText: {
    fontSize: 32,
    marginBottom: 12,
  },
  diaryImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  diaryText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.text,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  viewFullButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

