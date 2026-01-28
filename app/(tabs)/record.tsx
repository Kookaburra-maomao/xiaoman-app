import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryCountItem, getDiaryCount } from '@/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// image_url 为 JSON 字符串数组，如 '["/api/files/xxx.png", ...]'
function parseImageUrl(imageUrl?: string | null): { hasImage: boolean; firstImageUrl: string | null } {
  if (!imageUrl || imageUrl.trim() === '') return { hasImage: false, firstImageUrl: null };
  try {
    const parsed = JSON.parse(imageUrl);
    if (!Array.isArray(parsed) || parsed.length === 0) return { hasImage: false, firstImageUrl: null };
    const first = parsed[0];
    if (typeof first !== 'string' || first.trim() === '') return { hasImage: false, firstImageUrl: null };
    const url = first.startsWith('http') ? first : `${apiUrl}${first.startsWith('/') ? '' : '/'}${first}`;
    return { hasImage: true, firstImageUrl: url };
  } catch {
    return { hasImage: false, firstImageUrl: null };
  }
}

export default function RecordScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryCounts, setDiaryCounts] = useState<DiaryCountItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取当前年月
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 获取今天的日期
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // 获取月份第一天和最后一天
  const getMonthDateRange = useCallback((year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    return { startDate: startDateStr, endDate: endDateStr };
  }, []);

  // 获取日记统计信息
  const fetchDiaryCounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { startDate, endDate } = getMonthDateRange(year, month);
      const data = await getDiaryCount(user.id, startDate, endDate);
      setDiaryCounts(data);
    } catch (error) {
      console.error('获取日记统计信息失败:', error);
      setDiaryCounts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, year, month, getMonthDateRange]);

  // 进入页面时获取数据
  useFocusEffect(
    useCallback(() => {
      fetchDiaryCounts();
    }, [fetchDiaryCounts])
  );

  // 月份切换时获取数据
  useEffect(() => {
    fetchDiaryCounts();
  }, [year, month, fetchDiaryCounts]);

  // 获取月份第一天是星期几
  const firstDay = new Date(year, month, 1).getDay();
  
  // 获取月份有多少天
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // 获取上个月有多少天（用于显示上个月的日期）
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // 生成日历日期数组
  const calendarDays: (number | null)[] = [];
  
  // 添加上个月的日期（灰色显示）
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push(null);
  }
  
  // 添加当月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  
  // 添加下个月的日期（补齐到6行）
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push(null);
  }

  // 获取某一天的日记数据
  const getDayData = (day: number | null): DiaryCountItem | null => {
    if (day === null) return null;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return diaryCounts.find(item => item.diary_date === dateStr) || null;
  };

  // 切换到上个月
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 切换到下个月
  const goToNextMonth = () => {
    if (!isCurrentMonth) {
      setCurrentDate(new Date(year, month + 1, 1));
    }
  };

  // 点击日期进入详情页
  const handleDayPress = (day: number | null) => {
    if (day === null) return;
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    router.push({
      pathname: '/record-detail',
      params: {
        date: dateStr,
      },
    });
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* 日历 */}
        <View style={styles.calendarContainer}>
          {/* 年月和切换按钮 */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.monthYearText}>
              {year}年{month + 1}月
            </Text>
            <TouchableOpacity 
              onPress={goToNextMonth} 
              style={styles.arrowButton}
              disabled={isCurrentMonth}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={isCurrentMonth ? Colors.light.icon : Colors.light.text} 
              />
            </TouchableOpacity>
          </View>

          {/* 星期行 */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* 日期网格 */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const isCurrentMonthDay = day !== null;
              const isTodayDate = isToday(day);
              const dayData = getDayData(day);
              const { hasImage, firstImageUrl } = parseImageUrl(dayData?.image_url);
              const hasEmoji = dayData?.emoji && !hasImage;
              const hasRecord = dayData && dayData.diary_count >= 1 && !hasImage && !hasEmoji;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !isCurrentMonthDay && styles.dayCellOtherMonth,
                    isTodayDate && styles.dayCellToday,
                    hasRecord && !isTodayDate && styles.dayCellWithRecord,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleDayPress(day)}
                  disabled={!isCurrentMonthDay}
                >
                  {hasImage && firstImageUrl ? (
                    // 情况1：有图片（取第一张展示）
                    <View style={styles.dayCellWithImage}>
                      <Image
                        source={{ uri: firstImageUrl }}
                        style={styles.dayImage}
                        resizeMode="cover"
                      />
                      <View style={styles.dayImageOverlay} >
                        <Text style={styles.dayTextOnImage}>{day}</Text>
                      </View>
                    </View>
                  ) : hasEmoji ? (
                    // 情况2：无图片有emoji
                    <Text style={styles.dayEmoji}>{dayData.emoji}</Text>
                  ) : (
                    // 情况3和4：正常展示或特殊背景色
                    day !== null && (
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonthDay && styles.dayTextOtherMonth,
                          isTodayDate && styles.dayTextToday,
                          hasRecord && styles.dayTextWithRecord,
                        ]}
                      >
                        {day}
                      </Text>
                    )
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 20,
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
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  arrowButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 14,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  dayCellOtherMonth: {
    opacity: 0.3,
  },
  dayCellToday: {
    backgroundColor: '#4A90E2', // 今天的背景色（蓝色）
  },
  dayCellWithRecord: {
    backgroundColor: '#52C41A', // 有记录的背景色（绿色）
  },
  dayCellWithImage: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  dayImage: {
    width: '100%',
    height: '100%',
  },
  dayImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // 20%透明度黑色
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTextOnImage: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayEmoji: {
    fontSize: 24,
  },
  dayText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dayTextOtherMonth: {
    color: Colors.light.icon,
  },
  dayTextToday: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    backgroundColor: '#4A90E2', // 今天的背景色（蓝色）
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayTextWithRecord: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    backgroundColor: '#52C41A', // 有记录的背景色（绿色）
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
});
