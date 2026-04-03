/**
 * 日记卡片内容组件 - 统一样式
 * 用于 diary-detail、diary-share、DiaryGenerateModal
 */

import MarkdownText from '@/components/common/MarkdownText';
import { scaleSize } from '@/utils/screen';

import React from 'react';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';

const STAMP_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-stamp.png';
const DIARY_BG_URL = 'http://xiaomanriji.com/api/files/xiaoman-diary-bg.png';

interface DiaryCardContentProps {
  date: string;
  weather?: string;
  weekdayTime: string;
  province?: string;
  city?: string;
  imageContent?: React.ReactNode;
  diaryContent?: React.ReactNode;
  context?: string;
  showFooter?: boolean;
  markdownStyles?: any;
}

export default function DiaryCardContent({
  date, weather, weekdayTime, province, city,
  imageContent, diaryContent, context,
  showFooter = true, markdownStyles,
}: DiaryCardContentProps) {
  const locationText = province && city ? (province === city ? city : province + ' · ' + city) : province || city || '';

  return (
    <View style={styles.card}>
      <ImageBackground
        source={{ uri: DIARY_BG_URL }}
        style={styles.cardBgImage}
        resizeMode="repeat"
      >
        <Image source={{ uri: STAMP_ICON_URL }} style={styles.stampIcon} resizeMode="contain" />
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel} allowFontScaling={false}>Date </Text>
        <Text style={styles.dateValue} allowFontScaling={false}>{date}</Text>
      </View>
      {weather ? (
        <Text style={styles.weatherText} allowFontScaling={false}>{weather}</Text>
      ) : (
        <View style={styles.weatherPlaceholder} />
      )}
      <View style={styles.timeLocationRow}>
        <Text style={styles.timeLocationText} allowFontScaling={false}>{weekdayTime}</Text>
        {locationText ? (
          <Text style={styles.timeLocationText} allowFontScaling={false}>{locationText}</Text>
        ) : null}
      </View>
      <View style={styles.divider} />
      {imageContent && <View style={styles.imageSection}>{imageContent}</View>}
      <View style={styles.contentSection}>
        {diaryContent ? diaryContent : context ? (
          <MarkdownText style={markdownStyles || diaryMarkdownStyles}>{context}</MarkdownText>
        ) : null}
      </View>
      {showFooter && (
        <>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText} allowFontScaling={false}>小满日记</Text>
        </>
      )}
      </ImageBackground>
    </View>
  );
}

const diaryMarkdownStyles = StyleSheet.create({
  body: { fontSize: scaleSize(14), lineHeight: scaleSize(26), color: '#222222' },
  paragraph: { marginTop: 0, marginBottom: scaleSize(8) },
  heading1: { fontSize: scaleSize(18), fontWeight: '600', marginBottom: scaleSize(8), color: '#222222' },
  heading2: { fontSize: scaleSize(16), fontWeight: '600', marginBottom: scaleSize(8), color: '#222222' },
  heading3: { fontSize: scaleSize(14), fontWeight: '600', marginBottom: scaleSize(8), color: '#222222' },
  strong: { fontWeight: '600', color: '#222222' },
  em: { fontStyle: 'italic' },
  link: { color: '#1a73e8', textDecorationLine: 'underline' },
  text: { fontSize: scaleSize(14), lineHeight: scaleSize(26) },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    marginHorizontal: scaleSize(16),
    marginTop: scaleSize(20),
    paddingBottom: scaleSize(16),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.1,
    shadowRadius: scaleSize(4),
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',

  },
  cardBgImage: {
    flex: 1,
    width: '100%',
  },
  stampIcon: {
    position: 'absolute',
    top: scaleSize(10),
    left: 0,
    width: scaleSize(66),
    height: scaleSize(50),
    zIndex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scaleSize(24),
  },
  dateLabel: {
    fontSize: scaleSize(16),
    fontWeight: '400',
    lineHeight: scaleSize(18),
    color: '#666666',
  },
  dateValue: {
    fontSize: scaleSize(16),
    fontWeight: '900',
    lineHeight: scaleSize(18),
    color: '#222222',
  },
  weatherText: {
    marginTop: scaleSize(8),
    fontSize: scaleSize(14),
    fontWeight: '700',
    lineHeight: scaleSize(18),
    color: '#222222',
    textAlign: 'center',
  },
  weatherPlaceholder: {
    height: scaleSize(8),
  },
  timeLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: scaleSize(20),
    paddingHorizontal: scaleSize(20),
  },
  timeLocationText: {
    fontSize: scaleSize(12),
    fontWeight: '400',
    lineHeight: scaleSize(20),
    color: '#222222',
  },
  divider: {
    height: scaleSize(0.3),
    backgroundColor: '#000000',
    marginTop: scaleSize(8),
    marginHorizontal: scaleSize(20),
  },
  imageSection: {
    marginTop: scaleSize(20),
    paddingHorizontal: scaleSize(20),
  },
  contentSection: {
    marginTop: scaleSize(20),
    paddingHorizontal: scaleSize(20),
  },
  footerDivider: {
    height: scaleSize(0.3),
    backgroundColor: '#000000',
    marginTop: scaleSize(36),
    marginHorizontal: scaleSize(20),
  },
  footerText: {
    marginTop: scaleSize(8),
    fontSize: scaleSize(12),
    fontWeight: '400',
    lineHeight: scaleSize(20),
    color: '#222222',
    textAlign: 'center',
  },
});
