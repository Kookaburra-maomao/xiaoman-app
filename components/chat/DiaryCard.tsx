/**
 * 日记卡片组件
 */

import { Colors } from '@/constants/theme';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import { Image, StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface DiaryCardProps {
  context: string;
  pic?: string;
  gmt_create?: string; // 创建时间
}

// 格式化日期时间：12.25 星期日 16:33
const formatDateTime = (gmt_create?: string): string => {
  if (!gmt_create) return '';
  
  try {
    const date = new Date(gmt_create);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // 星期几
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    
    // 格式化时间：16:33
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return `${month}.${day} ${weekday} ${timeStr}`;
  } catch {
    return '';
  }
};

// 获取第一张图片URL
const getFirstImageUrl = (pic?: string): string | undefined => {
  if (!pic) return undefined;
  
  const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
  
  // 如果 pic 是数组字符串，解析它
  if (pic.startsWith('[') || pic.includes(',')) {
    try {
      const picArray = JSON.parse(pic);
      if (Array.isArray(picArray) && picArray.length > 0) {
        const firstPic = picArray[0];
        return firstPic.startsWith('http') ? firstPic : `${apiUrl}${firstPic}`;
      }
    } catch {
      // 如果解析失败，当作单个字符串处理
    }
  }
  
  // 单个图片URL
  return pic.startsWith('http') ? pic : `${apiUrl}${pic}`;
};

// 截断文本：有图片时50字，无图片时100字
const truncateText = (text: string, hasImage: boolean): string => {
  const maxLength = hasImage ? 50 : 100;
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export default function DiaryCard({ context, pic, gmt_create }: DiaryCardProps) {
  const imageUrl = getFirstImageUrl(pic);
  const dateTimeStr = formatDateTime(gmt_create);
  const truncatedContext = truncateText(context, !!imageUrl);

  return (
    <View style={styles.diaryCard}>
      {/* 第一行：日期时间 */}
      {/* {dateTimeStr && (
        <Text style={styles.dateTimeText}>{dateTimeStr}</Text>
      )}
       */}
      {/* 日记信息区域 */}
      <View style={styles.diaryContentContainer}>
        {imageUrl ? (
          <View style={styles.diaryContentWithImage}>
            <Image source={{ uri: imageUrl }} style={styles.diaryImage} resizeMode="cover" />
            <View style={styles.diaryTextContainer}>
              <Markdown style={defaultMarkdownStyles}>
                {truncatedContext}
              </Markdown>
            </View>
          </View>
        ) : (
          <View style={styles.diaryTextOnlyContainer}>
            <Markdown style={defaultMarkdownStyles}>
              {truncatedContext}
            </Markdown>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  diaryCard: {
    width: '100%',
    padding: scaleSize(16),
    borderRadius: scaleSize(16),
    backgroundColor: '#FAFAFAE5',
  },
  dateTimeText: {
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
  },
  diaryContentContainer: {
    // marginTop: scaleSize(12),
    flex: 1,
  },
  diaryContentWithImage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  diaryImage: {
    width: scaleSize(100),
    height: scaleSize(100),
    borderRadius: scaleSize(8),
    marginRight: scaleSize(16),
  },
  diaryTextContainer: {
    flex: 1,
    // marginLeft: scaleSize(16),
  },
  diaryTextOnlyContainer: {
    flex: 1,
  },
  diaryText: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(20),
    color: Colors.light.text,
  },
});
