import MarkdownText from '@/components/common/MarkdownText';
import { Colors } from '@/constants/theme';
import { DiarySummary, getDiarySummaryDetail } from '@/services/diarySummaryService';
import { scaleSize } from '@/utils/screen';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

const RETURN_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-top-return.png';
const STAMP_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-stamp.png';
const DIARY_BG_URL = 'http://xiaomanriji.com/api/files/xiaoman-diary-bg.png';

const TYPE_LABELS: Record<string, string> = {
  week: '周总结',
  month: '月总结',
  year: '年总结',
};

export default function DiaryReviewDetailScreen() {
  const router = useRouter();
  const { summaryId } = useLocalSearchParams<{ summaryId: string }>();
  const [summary, setSummary] = useState<DiarySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (!summaryId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getDiarySummaryDetail(summaryId);
        setSummary(data);
      } catch (error) {
        console.error('获取总结详情失败:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [summaryId]);

  const handleSaveImage = async () => {
    try {
      setSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能保存图片');
        return;
      }
      const uri = await viewShotRef.current?.capture?.();
      if (uri) {
        await MediaLibrary.createAssetAsync(uri);
        Alert.alert('', '已保存到相册');
      }
    } catch (e: any) {
      Alert.alert('保存失败', e.message || '请重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
        <StatusBar hidden />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.light.icon} />
        </View>
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
        <StatusBar hidden />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image source={{ uri: RETURN_ICON_URL }} style={styles.backIcon} resizeMode="contain" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} allowFontScaling={false}>日记回顾</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText} allowFontScaling={false}>总结不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
      <StatusBar hidden />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={{ uri: RETURN_ICON_URL }} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>
          详情
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        >
          <View style={styles.card}>
            <ImageBackground
              source={{ uri: DIARY_BG_URL }}
              style={styles.cardBgImage}
              resizeMode="repeat"
            >
              <Image source={{ uri: STAMP_ICON_URL }} style={styles.stampIcon} resizeMode="contain" />
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel} allowFontScaling={false}>Date </Text>
                <Text style={styles.dateValue} allowFontScaling={false}>{summary.date_show}</Text>
              </View>
              <View style={styles.typeRow}>
                <Text style={styles.typeText} allowFontScaling={false}>{summary.gmt_create ? `${new Date(summary.gmt_create).getFullYear()}年` : '日记回顾'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.contentSection}>
                <MarkdownText style={markdownStyles}>{summary.content}</MarkdownText>
              </View>
              <View style={styles.footerDivider} />
              <Text style={styles.footerText} allowFontScaling={false}>小满日记</Text>
            </ImageBackground>
          </View>
        </ViewShot>

        <View style={styles.saveButtonWrapper}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveImage}
            activeOpacity={0.7}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveText} allowFontScaling={false}>保存图片</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const markdownStyles = StyleSheet.create({
  body: { fontSize: scaleSize(14), lineHeight: scaleSize(26), color: '#222222' },
  paragraph: { marginTop: 0, marginBottom: scaleSize(8) },
  heading1: { fontSize: scaleSize(18), fontWeight: '600', marginBottom: scaleSize(8), color: '#222222' },
  heading2: { fontSize: scaleSize(16), fontWeight: '600', marginBottom: scaleSize(8), color: '#222222' },
  heading3: { fontSize: scaleSize(14), fontWeight: '600', marginBottom: scaleSize(8), color: '#222222' },
  strong: { fontWeight: '600', color: '#222222' },
  em: { fontStyle: 'italic' },
  text: { fontSize: scaleSize(14), lineHeight: scaleSize(26) },
  hr: { height: 0.6, backgroundColor: '#000', marginVertical: scaleSize(12) },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16), paddingVertical: scaleSize(12),
  },
  backButton: { width: scaleSize(40), height: scaleSize(40), justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: scaleSize(40), height: scaleSize(40) },
  headerTitle: { fontSize: scaleSize(18), fontWeight: '600', color: Colors.light.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: scaleSize(14), color: Colors.light.icon },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: scaleSize(40) },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: scaleSize(12),
    marginHorizontal: scaleSize(16), marginTop: scaleSize(20),
    paddingBottom: scaleSize(16), overflow: 'hidden',
    shadowColor: '#000000', shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.1, shadowRadius: scaleSize(4), elevation: 4,
  },
  cardBgImage: { flex: 1, width: '100%' },
  stampIcon: {
    position: 'absolute', top: scaleSize(10), left: 0,
    width: scaleSize(66), height: scaleSize(50), zIndex: 1,
  },
  dateRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: scaleSize(24),
  },
  dateLabel: { fontSize: scaleSize(16), fontWeight: '400', lineHeight: scaleSize(18), color: '#666666' },
  dateValue: { fontSize: scaleSize(16), fontWeight: '900', lineHeight: scaleSize(18), color: '#222222' },
  typeRow: { marginTop: scaleSize(8), alignItems: 'center' },
  typeText: { fontSize: scaleSize(14), fontWeight: '700', lineHeight: scaleSize(18), color: '#222222' },
  divider: { height: scaleSize(0.3), backgroundColor: '#000000', marginTop: scaleSize(20), marginHorizontal: scaleSize(20) },
  contentSection: { marginTop: scaleSize(20), paddingHorizontal: scaleSize(20) },
  footerDivider: { height: scaleSize(0.3), backgroundColor: '#000000', marginTop: scaleSize(36), marginHorizontal: scaleSize(20) },
  footerText: {
    marginTop: scaleSize(8), fontSize: scaleSize(12), fontWeight: '400',
    lineHeight: scaleSize(20), color: '#222222', textAlign: 'center',
  },
  saveButtonWrapper: { alignItems: 'center', marginTop: scaleSize(24) },
  saveButton: {
    width: scaleSize(335), height: scaleSize(50), justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#000', borderRadius: scaleSize(12),
  },
  saveText: { fontSize: scaleSize(16), fontWeight: '600', color: '#fff' },
});
