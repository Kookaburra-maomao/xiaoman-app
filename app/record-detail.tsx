import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryByDateItem, getChatRecords, getDiariesByDate } from '@/services/chatService';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

// 获取第一张图片（pic 为 JSON 字符串数组，如 '["/api/files/xxx.png", ...]'）
const getFirstImage = (pic?: string | null): string | null => {
  if (!pic || pic.trim() === '') return null;
  try {
    const parsed = JSON.parse(pic);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const first = parsed[0];
      return typeof first === 'string' && first.trim() !== '' ? first.trim() : null;
    }
  } catch {
    // 兼容旧格式：逗号分隔
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

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export default function RecordDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [diaries, setDiaries] = useState<DiaryByDateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatRecordsCount, setChatRecordsCount] = useState(0); // 对话记录数量

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

  // 获取对话记录数量
  const fetchChatRecordsCount = async () => {
    if (!user?.id || !date) return;

    try {
      // 构建当天的开始和结束时间
      const startTime = `${date} 00:00:00`;
      const endTime = `${date} 23:59:59`;
      
      const records = await getChatRecords(user.id, startTime, endTime);
      setChatRecordsCount(records.length);
    } catch (error) {
      console.error('获取对话记录失败:', error);
      setChatRecordsCount(0);
    }
  };

  useEffect(() => {
    fetchDiaries();
    fetchChatRecordsCount();
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
                {/* 时间轴左侧：时间在节点上方 */}
                <View style={styles.timelineLeft}>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{formatTime(diary.gmt_create)}</Text>
                    <Text style={styles.timePeriodText}>{formatTimePeriod(diary.gmt_create)}</Text>
                  </View>
                  <View style={styles.timelineDot} />
                  {/* 只有多个日记时才显示连接线和底部圆点 */}
                  {diaries.length > 1 && index < diaries.length - 1 && <View style={styles.timelineLine} />}
                  {diaries.length > 1 && <View style={styles.timelineDot} />}
                </View>

                {/* 内容区域 */}
                <View style={styles.timelineContent}>
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
                        <Markdown style={defaultMarkdownStyles}>
                          {truncateText(diary.context)}
                        </Markdown>
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

          {/* 对话记录入口 */}
          {chatRecordsCount > 0 && (
            <TouchableOpacity
              style={styles.chatsRecordWrap}
              onPress={() => {
                router.push({
                  pathname: '/chat-record-day',
                  params: {
                    date: date,
                  },
                });
              }}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-chat.png' }}
                style={styles.chatRecordIcon}
                resizeMode="contain"
              />
              <Text style={styles.chatRecordText}>{chatRecordsCount}条对话记录</Text>
            </TouchableOpacity>
          )}
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
    alignItems: 'center',
    marginRight: 12,
  },
  timeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  timePeriodText: {
    fontSize: scaleSize(12),
    color: Colors.light.text,
    marginTop: 2,
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
    marginLeft: 4,
    marginTop: 4,
    borderStyle: 'dashed',
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
    alignSelf: 'stretch',
  },
  viewFullButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  chatsRecordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  chatRecordIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  chatRecordText: {
    fontSize: 14,
    color: '#666666',
  },
});

