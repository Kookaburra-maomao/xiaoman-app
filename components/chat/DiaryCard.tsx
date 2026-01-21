/**
 * 日记卡片组件
 */

import { Colors } from '@/constants/theme';
import { Image, StyleSheet, Text, View } from 'react-native';

interface DiaryCardProps {
  context: string;
  pic?: string;
}

export default function DiaryCard({ context, pic }: DiaryCardProps) {
  const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
  const imageUrl = pic ? (pic.startsWith('http') ? pic : `${apiUrl}${pic}`) : undefined;

  return (
    <View style={styles.diaryCard}>
      {imageUrl ? (
        <View style={styles.diaryCardWithImage}>
          <Image source={{ uri: imageUrl }} style={styles.diaryImage} resizeMode="cover" />
          <View style={styles.diaryTextContainer}>
            <Text style={styles.diaryText} numberOfLines={4} ellipsizeMode="tail">
              {context}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.diaryTextOnlyContainer}>
          <Text style={styles.diaryText} numberOfLines={4} ellipsizeMode="tail">
            {context}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  diaryCard: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  diaryCardWithImage: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    padding: 10,
  },
  diaryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  diaryTextContainer: {
    justifyContent: 'center',
    paddingRight: 4,
  },
  diaryTextOnlyContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  diaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.text,
  },
});

