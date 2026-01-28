/**
 * 日记图片轮播组件（多图横滑，露出下一张约 10px）
 */

import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import React, { useRef, useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

const IMAGE_SIZE = scaleSize(300);
const SCROLL_VIEW_WIDTH = scaleSize(310); // 300 + 10px 露出

export interface DiaryImageCarouselProps {
  /** 图片 URL 列表（可为相对路径，由 apiUrl 拼接） */
  imageUrls: string[];
  /** API 基础 URL，用于拼接非 http 的路径 */
  apiUrl?: string;
  /** 是否显示底部指示点 */
  showIndicator?: boolean;
}

function resolveImageUri(url: string, apiUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${apiUrl}${url}`;
  return `${apiUrl}/${url}`;
}

export default function DiaryImageCarousel({
  imageUrls,
  apiUrl = '',
  showIndicator = true,
}: DiaryImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const imageList = imageUrls.map((url) => resolveImageUri(url, apiUrl));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / IMAGE_SIZE);
    setCurrentIndex(index);
  };

  if (imageList.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={IMAGE_SIZE}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {imageList.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image
              source={{ uri }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: scaleSize(14),
    alignItems: 'center',
  },
  scrollView: {
    width: SCROLL_VIEW_WIDTH,
  },
  scrollContent: {
    paddingRight: 0,
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginRight: 0,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: scaleSize(8),
    backgroundColor: '#F5F5F5',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSize(12),
    gap: scaleSize(6),
  },
  indicator: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: '#D0D0D0',
  },
  indicatorActive: {
    backgroundColor: Colors.light.tint,
  },
});
