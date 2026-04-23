import ChatHeader from '@/components/chat/ChatHeader';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useLog } from '@/hooks/useLog';
import { useOperationCard } from '@/hooks/useOperationCard';
import { DiaryCountItem, getDiaryCount } from '@/services/chatService';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const DIARY_UNLOCK_KEY = '@xiaoman_diary_unlock_ts';
const DIARY_UNLOCK_DURATION = 60 * 60 * 1000; // 1小时
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
  const { user, refreshAuth } = useAuth();
  const router = useRouter();
  const { log } = useLog();
  const [searchText, setSearchText] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryCounts, setDiaryCounts] = useState<DiaryCountItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 日记加密相关状态
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const passwordInputRef = useRef<TextInput>(null);
  // 是否开启日记加密
  const diaryEncryptionEnabled = user?.diary_secret === 'true';
  
  // 我的记录统计数据
  const [todayRecords, setTodayRecords] = useState(0); // 今天对话轮数
  const [weekDays, setWeekDays] = useState(0); // 本周累计记录天数
  const [weekDiaryCount, setWeekDiaryCount] = useState(0); // 本周生成日记篇数
  
  // 使用运营卡片 Hook（不自动检查，手动控制显示）
  const {
    showCard,
    operationCards,
    cardSlideAnim,
    cardTranslateY,
    setShowCard,
    fetchOperationCards,
    toggleCard,
  } = useOperationCard({ autoCheck: false });
  
  // 获取安全区域边距，用于计算header高度
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + scaleSize(16) + scaleSize(24) + scaleSize(14) + scaleSize(20); // top inset + paddingTop + title height + date height + paddingBottom

  // 页面曝光打点
  useFocusEffect(
    useCallback(() => {
      log('RECORD_TAB_EXPO');
    }, [])
  );

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

  // 获取我的记录统计数据
  const fetchMyRecordStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 1. 获取今天的对话轮数
      const today = new Date();
      const todayStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 00:00:00`;
      const todayEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} 23:59:59`;
      
      const todayRecordsResponse = await fetch(
        `${apiUrl}/api/chat/records?user_id=${user.id}&start_time=${encodeURIComponent(todayStart)}&end_time=${encodeURIComponent(todayEnd)}`
      );
      const todayRecordsData = await todayRecordsResponse.json();
      const todayRecordsCount = todayRecordsData.code === 200 && Array.isArray(todayRecordsData.data) 
        ? todayRecordsData.data.filter((record: any) => record.chat_from === 'user').length 
        : 0;
      setTodayRecords(todayRecordsCount);

      // 2. 获取本周的日记统计数据
      // 计算本周一的日期
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日是0，需要特殊处理
      const monday = new Date(today);
      monday.setDate(today.getDate() - diff);
      monday.setHours(0, 0, 0, 0);
      
      const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
      const weekEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const weekDiaryData = await getDiaryCount(user.id, weekStart, weekEnd);
      
      // 计算本周累计记录天数（diary_count >= 1 的天数）
      const daysWithRecords = weekDiaryData.filter(item => item.diary_count >= 1).length;
      setWeekDays(daysWithRecords);
      
      // 计算本周生成日记总篇数（所有 diary_count 的累加）
      const totalDiaryCount = weekDiaryData.reduce((sum, item) => sum + item.diary_count, 0);
      setWeekDiaryCount(totalDiaryCount);
      
    } catch (error) {
      console.error('获取我的记录统计数据失败:', error);
      setTodayRecords(0);
      setWeekDays(0);
      setWeekDiaryCount(0);
    }
  }, [user?.id]);

  // 验证日记密码
  const handleVerifyPassword = useCallback(async () => {
    if (password.length !== 4) {
      setVerifyError('请输入4位密码');
      return;
    }
    try {
      setVerifyLoading(true);
      setVerifyError('');
      const res = await fetch(`${apiUrl}/api/users/verify-diary-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, diary_password: password }),
      });
      const result = await res.json();
      if (result.code === 200 && result.data?.verified) {
        setIsUnlocked(true);
        setPassword('');
        setVerifyError('');
        // 记录解锁时间戳，1小时内免验证
        await AsyncStorage.setItem(DIARY_UNLOCK_KEY, String(Date.now()));
        // 解锁后加载数据
        fetchDiaryCounts();
        fetchOperationCards();
        fetchMyRecordStats();
      } else {
        setVerifyError('密码错误，请重试');
        setPassword('');
      }
    } catch {
      setVerifyError('验证失败，请重试');
    } finally {
      setVerifyLoading(false);
    }
  }, [password, user?.id, fetchDiaryCounts, fetchOperationCards, fetchMyRecordStats]);

  // 进入页面时：检查加密状态并加载数据
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      if (user.diary_secret === 'true') {
        // 检查是否在1小时免验证期内
        (async () => {
          try {
            const ts = await AsyncStorage.getItem(DIARY_UNLOCK_KEY);
            if (ts && Date.now() - Number(ts) < DIARY_UNLOCK_DURATION) {
              // 免验证期内，直接解锁
              setIsUnlocked(true);
              fetchDiaryCounts();
              fetchOperationCards();
              fetchMyRecordStats();
              return;
            }
          } catch {}
          // 需要验证
          setIsUnlocked(false);
          setPassword('');
          setVerifyError('');
        })();
      } else {
        // 未开启加密，直接加载数据
        setIsUnlocked(true);
        fetchDiaryCounts();
        fetchOperationCards();
        fetchMyRecordStats();
      }
    }, [user?.id, user?.diary_secret, fetchDiaryCounts, fetchOperationCards, fetchMyRecordStats])
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
  
  // 计算需要的总行数（向上取整到整周）
  const totalCells = calendarDays.length;
  const weeksNeeded = Math.ceil(totalCells / 7);
  const targetCells = weeksNeeded * 7;
  
  // 添加下个月的日期（补齐到整周）
  const remainingDays = targetCells - calendarDays.length;
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
    
    // 打点：点击某天进入记录复访落地页
    log('RECORD_SINGLE_DAY');
    
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

  // 判断是否为未来日期
  const isFutureDate = (day: number | null) => {
    if (day === null) return false;
    const dateToCheck = new Date(year, month, day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateToCheck > todayDate;
  };

  // 处理运营卡片切换按钮点击 - 切换卡片显示状态
  const handleToggleCard = useCallback(() => {
    toggleCard();
  }, [toggleCard]);

  // 处理运营卡片选项选择 - 跳转到 chat.tsx 并触发事件
  const handleOperationItemSelect = useCallback((promptRule: string, text: string, emoji: string) => {
    // 先隐藏卡片
    setShowCard(false);
    
    // 跳转到 chat tab，并通过路由参数传递选中的运营卡片信息
    router.push({
      pathname: '/(tabs)/chat',
      params: {
        operationPromptRule: promptRule,
        operationText: text,
        operationEmoji: emoji,
      },
    } as any);
  }, [router]);

  // 日记加密开启且未通过密码验证时显示锁屏
  if (diaryEncryptionEnabled && !isUnlocked) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar hidden />
        <View style={styles.lockScreen}>
          <Ionicons name="lock-closed" size={scaleSize(64)} color={Colors.light.icon} />
          <Text style={styles.lockTitle} allowFontScaling={false}>日记已加密</Text>
          <Text style={styles.lockHint} allowFontScaling={false}>请输入4位数字密码查看历史日记</Text>
          <TextInput
            ref={passwordInputRef}
            style={styles.lockInput}
            value={password}
            onChangeText={(text: string) => { setPassword(text); setVerifyError(''); }}
            placeholder="输入密码"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            allowFontScaling={false}
            autoFocus
          />
          {verifyError ? <Text style={styles.lockError} allowFontScaling={false}>{verifyError}</Text> : null}
          <TouchableOpacity
            style={[styles.lockButton, verifyLoading && { opacity: 0.6 }]}
            onPress={handleVerifyPassword}
            disabled={verifyLoading}
            activeOpacity={0.7}
          >
            {verifyLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.lockButtonText} allowFontScaling={false}>验证</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
      <StatusBar hidden />
      <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardView}
              keyboardVerticalOffset={0}
            >
      {/* 头部 - 添加顶部内边距以避免被状态栏遮挡 */}
      <View style={{ paddingTop: scaleSize(0) }}>
        <ChatHeader
          title="记录"
          showCard={false}
          onToggleCard={()=>{}}
          onShowMenu={() => router.push('/settings' as any)}
          isStreaming={false}
          hideCardButton={true} // 隐藏运营卡片按钮
        />
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollViewContent,  { paddingTop: Platform.OS === 'ios' ? scaleSize(60) : scaleSize(90) }]}
      >
        {/* 日历 */}
        <View style={styles.calendarContainer}>
          {/* 年月和切换按钮 */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goToPrevMonth} style={styles.arrowButton}>
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-calander-prev.png' }}
                style={{ width: scaleSize(28), height: scaleSize(28) }}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.monthYearText} allowFontScaling={false}>
              {year} - {month + 1}
            </Text>
            <TouchableOpacity 
              onPress={goToNextMonth} 
              style={styles.arrowButton}
              disabled={isCurrentMonth}
            >
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-calander-next.png' }}
                style={{ 
                  width: scaleSize(28), 
                  height: scaleSize(28),
                  opacity: isCurrentMonth ? 0.3 : 1,
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* 星期行 */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText} allowFontScaling={false}>{day}</Text>
              </View>
            ))}
          </View>

          {/* 日期网格 */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const isCurrentMonthDay = day !== null;
              const isTodayDate = isToday(day);
              const isFuture = isFutureDate(day);
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
                    hasRecord && styles.dayCellWithRecord,
                    isFuture && styles.dayCellFuture, // 未来日期样式
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleDayPress(day)}
                  disabled={!isCurrentMonthDay || isFuture} // 禁止点击未来日期
                >
                  {hasImage && firstImageUrl && !isFuture ? (
                    // 情况1：有图片（取第一张展示）- 未来日期不显示图片
                    <View style={styles.dayCellWithImage}>
                      <Image
                        source={{ uri: firstImageUrl }}
                        style={styles.dayImage}
                        resizeMode="cover"
                      />
                      <View style={styles.dayImageOverlay} >
                        <Text style={styles.dayTextOnImage} allowFontScaling={false}>{isTodayDate ? '今' : day}</Text>
                      </View>
                    </View>
                  ) : hasEmoji && !isFuture ? (
                    // 情况2：无图片有emoji - 未来日期不显示emoji
                    <View style={styles.dayCellWithImage}>
                      <Image source={{ uri: dayData.emoji }} style={styles.dayImage}
                        resizeMode="cover"/>
                      <View style={styles.dayImageOverlay} >
                        <Text style={styles.dayTextOnImage} allowFontScaling={false}>{isTodayDate ? '今' : day}</Text>
                      </View>
                    </View>
                    
                  ) : (
                    // 情况3和4：正常展示或特殊背景色
                    day !== null && (
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.dayText,
                          !isCurrentMonthDay && styles.dayTextOtherMonth,
                          isTodayDate && styles.dayTextToday,
                          hasRecord && styles.dayTextWithRecord,
                        ]}
                      >
                        {isTodayDate ? '今' : day}
                      </Text>
                    )
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 我的记录 */}
        <View style={styles.myRecordContainer}>
          <Text style={styles.myRecordTitle} allowFontScaling={false}>我的记录</Text>
          <Text style={styles.myRecordContent} allowFontScaling={false}>
            今天你对话了 <Text style={styles.myRecordHighlight} allowFontScaling={false}>{todayRecords}</Text> 轮，本周累计记录了 <Text style={styles.myRecordHighlight} allowFontScaling={false}>{weekDays}</Text> 天，共生成日记 <Text style={styles.myRecordHighlight} allowFontScaling={false}>{weekDiaryCount}</Text> 篇。再多聊聊让小满更了解你~
          </Text>
        </View>

        {/* 补写日记 */}
        {/* <TouchableOpacity
          style={styles.addDiaryButton}
          onPress={() => router.push('/diary-edit?mode=create' as any)}
          activeOpacity={0.7}
        >
          <Image source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-diary-detail.png' }} style={styles.addDiaryIcon} resizeMode="contain" />
          <Text style={styles.addDiaryText} allowFontScaling={false}>补写日记</Text>
        </TouchableOpacity> */}
      </ScrollView>
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
  scrollView: {
  },
  scrollViewContent: {
    // paddingTop is set dynamically based on header height
  },


  calendarContainer: {
    marginHorizontal: scaleSize(16),
    marginBottom: scaleSize(20),
    // padding: scaleSize(16),
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSize(10),
    backgroundColor: '#00000008',
    borderRadius: scaleSize(40),
  },
  arrowButton: {
    padding: scaleSize(8),
  },
  monthYearText: {
    fontSize: scaleSize(16),
    fontWeight: '700',
    color: Colors.light.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: scaleSize(8),
  },
  weekdayCell: {
    width: `${100 / 7}%` as any,
    marginTop: scaleSize(8),
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: Colors.light.icon,
    fontWeight: '400',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    height: scaleSize(46),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scaleSize(8),
    borderRadius: scaleSize(8),
    overflow: 'hidden',
  },
  dayCellLastRow: {
    marginBottom: 0, // 移除最后一行的底部边距
  },
  dayCellOtherMonth: {
    opacity: 0.7,
  },
  dayCellToday: {
  },
  dayCellWithRecord: {
    backgroundColor: '#00000033', // 有记录的背景色（半透明黑色）
  },
  dayCellFuture: {
    opacity: 0.7, // 未来日期置灰
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
    fontSize: scaleSize(16),
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayEmoji: {
    borderWidth: scaleSize(1),
    fontSize: scaleSize(24),
  },
  dayText: {
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: Colors.light.text,
  },
  dayTextOtherMonth: {
    color: Colors.light.icon,
  },
  dayTextToday: {
    fontWeight: 'bold',
    paddingHorizontal: scaleSize(4),
    paddingVertical: scaleSize(2),
    borderRadius: scaleSize(4),
  },
  dayTextWithRecord: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    paddingHorizontal: scaleSize(4),
    paddingVertical: scaleSize(2),
    borderRadius: scaleSize(4),
  },
  dayTextFuture: {
    color: Colors.light.icon, // 未来日期文字颜色（灰色）
    opacity: 0.5,
  },
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSize(32),
  },
  lockTitle: {
    fontSize: scaleSize(20),
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: scaleSize(24),
    marginBottom: scaleSize(8),
  },
  lockHint: {
    fontSize: scaleSize(16),
    color: Colors.light.icon,
    marginBottom: scaleSize(16),
  },
  lockInput: {
    width: scaleSize(200),
    height: scaleSize(48),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(16),
    fontSize: scaleSize(16),
    color: '#222',
    marginBottom: scaleSize(12),
    textAlign: 'center',
    letterSpacing: scaleSize(8),
    backgroundColor: '#FFFFFF',
  },
  lockError: {
    fontSize: scaleSize(14),
    color: '#E74C3C',
    marginBottom: scaleSize(24),
  },
  lockButton: {
    paddingHorizontal: scaleSize(32),
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(8),
    backgroundColor: '#222',
    marginTop: scaleSize(12),
  },
  lockButtonText: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  myRecordContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    marginHorizontal: scaleSize(16),
    marginBottom: scaleSize(20),
    padding: scaleSize(12),
  },
  myRecordTitle: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: scaleSize(8),
  },
  myRecordContent: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(20),
    color: Colors.light.text,
  },
  myRecordHighlight: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    // color: Colors.light.tint,
  },
  addDiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: scaleSize(10),
    padding: scaleSize(12),
    marginHorizontal: scaleSize(16),
    marginTop: scaleSize(16),
    marginBottom: scaleSize(24),
  },
  addDiaryIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginRight: scaleSize(6),
    tintColor: '#FFFFFF',
  },
  addDiaryText: {
    fontSize: scaleSize(14),
    fontWeight: '400',
    lineHeight: scaleSize(22),
    color: '#FFFFFF',
  },
});
