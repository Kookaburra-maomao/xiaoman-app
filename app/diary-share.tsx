/**
 * 日记分享页：与详情 UI 一致，图片竖向排列，底部无按钮，居中二维码 +「小满日记」
 * 进入页面后自动截图保存到相册并 toast 保存成功
 */

import { Colors } from '@/constants/theme';
import { QR_CODE_URL } from '@/constants/urls';
import { DiaryDetail, getDiaryDetail } from '@/services/chatService';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewShot from 'react-native-view-shot';

// 根据图片 URI 获取宽高比，用于高度自适应
function useImageAspectRatios(uris: string[]) {
  const [ratios, setRatios] = useState<{ [key: string]: number }>({});
  useEffect(() => {
    if (uris.length === 0) return;
    let cancelled = false;
    uris.forEach((uri, index) => {
      Image.getSize(
        uri,
        (width, height) => {
          if (!cancelled && width > 0 && height > 0) {
            setRatios((prev) => ({ ...prev, [uri]: width / height }));
          }
        },
        () => {}
      );
    });
    return () => {
      cancelled = true;
    };
  }, [uris.join(',')]);
  return ratios;
}

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 解析图片列表（与 diary-detail 一致）
const parseImages = (pic?: string | null): string[] => {
  if (!pic || pic.trim() === '') return [];
  try {
    const parsed = JSON.parse(pic);
    if (Array.isArray(parsed)) {
      return parsed.filter((img: string) => img && img.trim() !== '');
    }
  } catch {
    return pic.split(',').map((img: string) => img.trim()).filter(Boolean);
  }
  return [];
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year} / ${month} / ${day}`;
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `星期${weekday} ${hours}:${minutes}`;
};

function resolveImageUri(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${apiUrl}${url}`;
  return `${apiUrl}/${url}`;
}

export default function DiaryShareScreen() {
  const router = useRouter();
  const { diaryId } = useLocalSearchParams<{ diaryId: string }>();
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const contentViewRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const hasAutoSavedRef = useRef(false);

  useEffect(() => {
    if (!diaryId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await getDiaryDetail(diaryId);
        if (!cancelled) setDiary(data);
      } catch (error) {
        if (!cancelled) {
          console.error('获取日记详情失败:', error);
          Alert.alert('错误', '获取日记详情失败，请重试');
          router.back();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [diaryId]);

  // 进入页面后自动截图保存到相册并 toast
  useEffect(() => {
    if (!diary || hasAutoSavedRef.current) return;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 800));
      if (!contentViewRef.current?.capture) return;

      try {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
        await new Promise((r) => setTimeout(r, 300));

        const uri = await contentViewRef.current.capture();
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('提示', '需要相册权限才能保存图片');
          return;
        }
        await MediaLibrary.createAssetAsync(uri);
        hasAutoSavedRef.current = true;
        Alert.alert('成功', '保存成功');
      } catch (e) {
        console.error('自动保存失败:', e);
        Alert.alert('错误', (e as Error).message || '保存失败，请重试');
      }
    };

    run();
  }, [diary]);

  // 图片列表 & 自适应宽高比（必须在所有 return 之前调用 hook）
  const images = diary ? parseImages(diary.pic).map(resolveImageUri) : [];
  const imageAspectRatios = useImageAspectRatios(images);

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

  if (!diary) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>分享</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ViewShot
          ref={contentViewRef}
          options={{ format: 'png', quality: 1, result: 'tmpfile' }}
          style={styles.contentView}
        >
          <View style={styles.infoCard}>
            {/* 日期和天气区域 */}
            <View style={styles.dateWeatherContainer}>
              <View style={styles.dateContainer}>
                <Text style={styles.dateText}>Date</Text>
                <Text style={styles.dateValue}>{formatDate(diary.gmt_create)}</Text>
              </View>
              {(diary.city || diary.weather) && (
                <Text style={styles.weatherText}>
                  {diary.city && diary.weather ? `${diary.city} · ${diary.weather}` : diary.city || diary.weather}
                </Text>
              )}
            </View>

            {/* 图片竖向排列，宽度 100% 高度按原图比例自适应 */}
            {images.length > 0 && (
              <View style={styles.imageColumn}>
                {images.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={[
                      styles.verticalImage,
                      { aspectRatio: imageAspectRatios[uri] ?? 1 },
                    ]}
                    resizeMode="contain"
                  />
                ))}
              </View>
            )}

            {/* 时间显示 */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(diary.gmt_create)}</Text>
            </View>

            {diary.context ? (
              <View style={styles.textContainer}>
                <Text style={styles.diaryText}>{diary.context}</Text>
              </View>
            ) : null}
          </View>

          {/* 居中二维码 + 小满日记 */}
          <View style={styles.qrSection}>
            <Image
              source={{ uri: QR_CODE_URL }}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.qrLabel}>小满日记</Text>
          </View>
        </ViewShot>
      </ScrollView>
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
  headerRight: {
    width: 40,
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
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
    display: 'flex',
    alignItems: 'flex-start',
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
  imageColumn: {
    marginTop: 8,
    gap: 12,
  },
  verticalImage: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
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
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  qrImage: {
    width: 64,
    height: 64,
  },
  qrLabel: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '500',
  },
});
