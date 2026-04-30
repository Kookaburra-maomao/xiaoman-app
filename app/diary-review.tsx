import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { clearReviewFlag, DiarySummary, getDiarySummaries } from '@/services/diarySummaryService';
import { scaleSize } from '@/utils/screen';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RETURN_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-top-return.png';
const FEATURE_LAUNCH_DATE = '2026-04-20';

type TabType = 'week' | 'month' | 'year';
const TABS: { key: TabType; label: string }[] = [
  { key: 'week', label: '周总结' },
  { key: 'month', label: '月总结' },
  { key: 'year', label: '年总结' },
];

interface TimelineItem {
  dateShow: string;
  summary: DiarySummary | null;
}

function formatDateShort(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}月${d}日`;
}

function generateWeekPeriods(launchDate: string): string[] {
  const periods: string[] = [];
  const launch = new Date(launchDate);
  const now = new Date();
  const launchDay = launch.getDay();
  const launchMonday = new Date(launch);
  launchMonday.setDate(launch.getDate() - (launchDay === 0 ? 6 : launchDay - 1));

  let current = new Date(launchMonday);
  while (current <= now) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    periods.push(formatDateShort(weekStart) + '~' + formatDateShort(weekEnd));
    current.setDate(current.getDate() + 7);
  }
  return periods.reverse();
}

function generateMonthPeriods(launchDate: string): string[] {
  const periods: string[] = [];
  const launch = new Date(launchDate);
  const now = new Date();
  let year = launch.getFullYear();
  let month = launch.getMonth();

  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    periods.push(formatDateShort(start) + '~' + formatDateShort(end));
    month++;
    if (month > 11) { month = 0; year++; }
  }
  return periods.reverse();
}

function generateYearPeriods(launchDate: string): string[] {
  const periods: string[] = [];
  const launch = new Date(launchDate);
  const now = new Date();
  for (let y = launch.getFullYear(); y <= now.getFullYear(); y++) {
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31);
    periods.push(formatDateShort(start) + '~' + formatDateShort(end));
  }
  return periods.reverse();
}

function buildTimeline(summaries: DiarySummary[], type: TabType): TimelineItem[] {
  const generators: Record<TabType, (d: string) => string[]> = {
    week: generateWeekPeriods,
    month: generateMonthPeriods,
    year: generateYearPeriods,
  };
  const periods = generators[type](FEATURE_LAUNCH_DATE);
  const summaryMap = new Map<string, DiarySummary>();
  summaries.forEach(s => summaryMap.set(s.date_show, s));

  return periods.map(dateShow => ({
    dateShow,
    summary: summaryMap.get(dateShow) || null,
  }));
}

export default function DiaryReviewScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('week');
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = useCallback(async (type: TabType) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getDiarySummaries(user.id, type);
      setTimeline(buildTimeline(data, type));
    } catch (error) {
      console.error('获取日记总结失败:', error);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clearFlag = useCallback(async (type: TabType) => {
    if (!user?.id) return;
    const flagKey = { week: 'is_week_new', month: 'is_month_new', year: 'is_year_new' }[type] as keyof typeof user;
    if (user[flagKey]) {
      try {
        await clearReviewFlag(user.id, type);
        setUser({ ...user, [flagKey]: 0 });
      } catch (e) {
        console.error('清除标记失败:', e);
      }
    }
  }, [user, setUser]);

  useFocusEffect(
    useCallback(() => {
      fetchSummaries('week');
      clearFlag('week');
    }, [fetchSummaries, clearFlag])
  );

  const handleTabChange = (type: TabType) => {
    setActiveTab(type);
    fetchSummaries(type);
    clearFlag(type);
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
      <StatusBar hidden />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={{ uri: RETURN_ICON_URL }} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          {`${String(new Date().getMonth() + 1).padStart(2, '0')}月${String(new Date().getDate()).padStart(2, '0')}日`}
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => handleTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
              allowFontScaling={false}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.light.icon} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {timeline.map((item) => (
            <TouchableOpacity
              key={item.dateShow}
              style={styles.card}
              activeOpacity={item.summary ? 0.7 : 1}
              onPress={() => {
                if (item.summary) {
                  router.push({ pathname: '/diary-review-detail', params: { summaryId: item.summary.id } } as any);
                }
              }}
              disabled={!item.summary}
            >
              <Text style={styles.cardDate} allowFontScaling={false}>{item.dateShow}</Text>
              <View style={styles.cardDivider} />
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-icon-yinhao.png' }}
                style={styles.cardQuoteIcon}
              />
              <Text
                style={[styles.cardText, !item.summary && styles.cardTextEmpty]}
                numberOfLines={3}
                allowFontScaling={false}
              >
                {item.summary ? item.summary.content.slice(0, 200) : '生活片段正在慢慢积累'}
              </Text>
            </TouchableOpacity>
          ))}
          {timeline.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText} allowFontScaling={false}>暂无总结数据</Text>
            </View>
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
    alignItems: 'center',
  },
  backIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  headerTitle: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: Colors.light.text,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: scaleSize(16),
  },
  tabButton: {
    width: scaleSize(120),
    alignItems: 'center',
    paddingVertical: scaleSize(8),
  },
  tabText: {
    fontSize: scaleSize(14),
    fontWeight: '400',
    color: '#666',
    lineHeight: scaleSize(22),
  },
  tabTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  tabIndicator: {
    width: scaleSize(29),
    height: scaleSize(2),
    backgroundColor: '#000',
    marginTop: scaleSize(9),
    borderRadius: scaleSize(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: scaleSize(40),
  },
  card: {
    marginHorizontal: scaleSize(16),
    marginTop: scaleSize(12),
    padding: scaleSize(12),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
  },
  cardDate: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: '#222',
    lineHeight: scaleSize(22),
  },
  cardDivider: {
    height: 0.5,
    backgroundColor: '#eee',
    marginVertical: scaleSize(12),
  },
  cardQuoteIcon: {
    width: scaleSize(24),
    height: scaleSize(24),
    marginBottom: scaleSize(4),
  },
  cardText: {
    fontSize: scaleSize(13),
    lineHeight: scaleSize(20),
    color: '#222',
  },
  cardTextEmpty: {
    color: Colors.light.icon,
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingTop: scaleSize(60),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: scaleSize(14),
    color: Colors.light.icon,
  },
});


