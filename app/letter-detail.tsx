import MarkdownText from '@/components/common/MarkdownText';
import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
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

const RETURN_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-top-return.png';
const DIARY_BG_URL = 'http://xiaomanriji.com/api/files/xiaoman-diary-bg.png';

export default function LetterDetailScreen() {
  const router = useRouter();
  const { title, content, gmt_online } = useLocalSearchParams<{
    letterId: string;
    title: string;
    content: string;
    gmt_online: string;
  }>();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
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
        <Text style={styles.headerTitle} allowFontScaling={false}></Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <ImageBackground
            source={{ uri: DIARY_BG_URL }}
            style={styles.cardBgImage}
            resizeMode="repeat"
          >
            <View style={styles.cardInner}>
              <Text style={styles.name} allowFontScaling={false}>{title}</Text>
              <Text style={styles.date} allowFontScaling={false}>{formatDate(gmt_online)}</Text>
              <View style={styles.divider} />
              <View style={styles.contentSection}>
                <MarkdownText style={markdownStyles}>{content || ''}</MarkdownText>
              </View>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16), paddingVertical: scaleSize(12),
  },
  backButton: { width: scaleSize(40), height: scaleSize(40), justifyContent: 'center', alignItems: 'center' },
  backIcon: { width: scaleSize(40), height: scaleSize(40) },
  headerTitle: { fontSize: scaleSize(18), fontWeight: '600', color: Colors.light.text },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: scaleSize(40) },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: scaleSize(16), marginTop: scaleSize(20),
    overflow: 'hidden',
    shadowColor: '#000000', shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.1, shadowRadius: scaleSize(4), elevation: 4,
  },
  cardBgImage: { flex: 1, width: '100%' },
  cardInner: { padding: scaleSize(20) },
  name: {
    fontSize: scaleSize(18),
    fontWeight: '900',
    lineHeight: scaleSize(18),
    color: '#222',
    textAlign: 'center',
  },
  date: {
    marginTop: scaleSize(8),
    fontSize: scaleSize(14),
    fontWeight: '700',
    lineHeight: scaleSize(18),
    color: '#222',
    textAlign: 'center',
  },
  divider: {
    marginTop: scaleSize(20),
    height: 0.6,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  contentSection: {
    marginTop: scaleSize(20),
  },
});

const markdownStyles = StyleSheet.create({
  body: { fontSize: scaleSize(14), fontWeight: '400', lineHeight: scaleSize(22), color: '#222' },
  paragraph: { marginTop: 0, marginBottom: scaleSize(8) },
  heading1: { fontSize: scaleSize(18), fontWeight: '600', marginBottom: scaleSize(8), color: '#222' },
  heading2: { fontSize: scaleSize(16), fontWeight: '600', marginBottom: scaleSize(8), color: '#222' },
  heading3: { fontSize: scaleSize(14), fontWeight: '600', marginBottom: scaleSize(8), color: '#222' },
  strong: { fontWeight: '600', color: '#222' },
  em: { fontStyle: 'italic' },
  text: { fontSize: scaleSize(14), lineHeight: scaleSize(22) },
  hr: { height: 0.6, backgroundColor: '#000', marginVertical: scaleSize(12) },
});