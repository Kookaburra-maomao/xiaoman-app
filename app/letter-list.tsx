import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { getOnlineLetters, Letter, markLettersRead } from '@/services/letterService';
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

export default function LetterListScreen() {
  const { user, setUser, refreshAuth } = useAuth();
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndMarkRead = useCallback(async () => {
    try {
      setLoading(true);
      const { list, maxLetterVersion } = await getOnlineLetters();
      setLetters(list);

      if (maxLetterVersion > (user?.letter_version || 0)) {
        await markLettersRead(maxLetterVersion);
        if (user) {
          setUser({ ...user, letter_version: maxLetterVersion });
        }
      }
    } catch (error) {
      console.error('获取来信列表失败:', error);
      setLetters([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
// PLACEHOLDER_PART2

  useFocusEffect(
    useCallback(() => {
      fetchAndMarkRead();
    }, [fetchAndMarkRead])
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['top'] : []}>
      <StatusBar hidden />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={{ uri: RETURN_ICON_URL }} style={styles.backIcon} resizeMode="contain" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>小满来信</Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : letters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText} allowFontScaling={false}>暂无来信</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {letters.map((letter) => (
            <TouchableOpacity
              key={letter.id}
              style={styles.letterCard}
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/letter-detail', params: { letterId: letter.id, title: letter.title, content: letter.content, gmt_online: letter.gmt_online } } as any)}
            >
              <View style={styles.letterLeft}>
                <Text style={styles.letterTitle} allowFontScaling={false} numberOfLines={1}>{letter.title}</Text>
                <Text style={styles.letterDate} allowFontScaling={false}>{formatDate(letter.gmt_online)}</Text>
              </View>
              <Image source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-image-letter.png' }} style={styles.letterImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
// PLACEHOLDER_STYLES

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
  },
  backButton: { width: scaleSize(40), height: scaleSize(40), justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: scaleSize(40), height: scaleSize(40) },
  headerTitle: { fontSize: scaleSize(18), fontWeight: '600', color: Colors.light.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: scaleSize(14), color: Colors.light.icon },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: scaleSize(40) },
  letterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    marginHorizontal: scaleSize(16),
    marginTop: scaleSize(12),
    padding: scaleSize(12),
  },
  letterLeft: { flex: 1 },
  letterTitle: {
    marginTop: scaleSize(7),
    fontSize: scaleSize(16),
    fontWeight: '600',
    lineHeight: scaleSize(24),
    color: '#222',
  },
  letterDate: {
    marginTop: scaleSize(4),
    fontSize: scaleSize(12),
    fontWeight: '400',
    lineHeight: scaleSize(18),
    color: '#999',
  },
  letterImage: {
    width: scaleSize(68),
    height: scaleSize(60),
    marginLeft: scaleSize(12),
  },
});
