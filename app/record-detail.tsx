import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryByDateItem, getChatRecords, getDiariesByDate } from '@/services/chatService';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
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
    return `${month}月${day}日`;
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
          <Image
            source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-top-return.png' }}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
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
                  {/* 只有不是最后一个日记时才显示连接线和底部圆点 */}
                  {index < diaries.length - 1 && (
                    <>
                      <View style={styles.timelineLine} />
                      <View style={styles.timelineDot} />
                    </>
                  )}
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

                    {/* 文字内容 - 只显示3行 */}
                    {diary.context && (
                      <>
                        <View style={styles.diaryTextWrapper}>
                          <View style={styles.diaryTextContainer}>
                            <Markdown style={defaultMarkdownStyles}>
                              {diary.context}
                            </Markdown>
                          </View>
                          
                        </View>
                        {/* 显示查看全文按钮 */}
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
                          <Image
                            source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-diary-detail.png' }}
                            style={styles.viewFullButtonIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.viewFullButtonText}>查看全文</Text>
                        </TouchableOpacity>
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
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),

  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  headerTitle: {
    fontSize: scaleSize(16),
    // fontWeight: 'bold',
    color: Colors.light.text,
    fontWeight: '600',
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
    fontSize: scaleSize(16),
    color: Colors.light.icon,
  },
  scrollView: {
    flex: 1,
  },
  timelineContainer: {
    padding: scaleSize(16),
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: scaleSize(24),
  },
  timelineLeft: {
    width: scaleSize(60),
    alignItems: 'center',
    marginRight: scaleSize(12),
  },
  timeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: scaleSize(6),
  },
  timeText: {
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    fontWeight: '800',
    color: Colors.light.text,
  },
  timePeriodText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: Colors.light.text,
    marginTop: scaleSize(3),
  },
  timelineDot: {
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: scaleSize(4),
    backgroundColor: '#D0D0D0',
    marginLeft: scaleSize(4),
  },
  timelineLine: {
    width: scaleSize(1),
    flex: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: scaleSize(4),
    marginTop: scaleSize(4),
    borderStyle: 'dashed',
  },
  timelineContent: {
    flex: 1,
  },
  diaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(8),
    padding: scaleSize(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scaleSize(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(4),
    elevation: 3,
  },
  emojiText: {
    fontSize: scaleSize(32),
    marginBottom: scaleSize(12),
  },
  diaryImage: {
    width: '100%',
    height: scaleSize(200),
    borderRadius: scaleSize(8),
    marginBottom: scaleSize(12),
  },
  diaryTextWrapper: {
    position: 'relative',
    marginBottom: scaleSize(12),
  },
  diaryTextContainer: {
    maxHeight: scaleSize(70), // 3 lines * 24px line height
    overflow: 'hidden',
  },
  diaryTextFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scaleSize(24), // 1 line height for fade effect
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.text,
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(16),
    borderRadius: scaleSize(8),
    alignSelf: 'stretch',
  },
  viewFullButtonIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginRight: scaleSize(6),
  },
  viewFullButtonText: {
    color: '#FFFFFF',
    fontSize: scaleSize(14),
    fontWeight: '600',
    marginLeft: scaleSize(6),
  },
  chatsRecordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scaleSize(50),
    marginBottom: scaleSize(20),
  },
  chatRecordIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginRight: scaleSize(6),
  },
  chatRecordText: {
    fontSize: scaleSize(14),
    color: '#666666',
  },
});

