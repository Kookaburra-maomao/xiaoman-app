/**
 * 日记卡片组件
 */

import { Colors } from '@/constants/theme';
import * as chatService from '@/services/chatService';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface DiaryCardProps {
  context: string;
  pic?: string;
  gmt_create?: string; // 创建时间
  diaryId?: string; // 日记ID，用于跳转到详情页
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

export default function DiaryCard({ context, pic, gmt_create, diaryId }: DiaryCardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const imageUrl = getFirstImageUrl(pic);
  const dateTimeStr = formatDateTime(gmt_create);
  const truncatedContext = truncateText(context, !!imageUrl);

  // 处理点击事件
  const handlePress = async () => {
    if (!diaryId || isChecking) return;

    try {
      setIsChecking(true);
      // 查询日记详情，检查状态
      const diaryDetail = await chatService.getDiaryDetail(diaryId);
      
      // 检查日记状态
      if (diaryDetail.status === 'deleted') {
        Alert.alert('提示', '该日记已被删除');
        return;
      }

      // 状态正常，跳转到详情页
      router.push({
        pathname: '/diary-detail',
        params: { diaryId },
      } as any);
    } catch (error) {
      console.error('获取日记详情失败:', error);
      Alert.alert('错误', '获取日记详情失败，请重试');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.diaryCard}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!diaryId || isChecking}
    >
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
        
        {/* 加载指示器 */}
        {isChecking && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.light.tint} />
          </View>
        )}
      </View>
    </TouchableOpacity>
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
    position: 'relative',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: scaleSize(8),
  },
});
