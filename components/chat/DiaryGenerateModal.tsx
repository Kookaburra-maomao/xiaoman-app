/**
 * 日记生成弹窗组件
 */

import DiaryActionButtons from '@/components/diary/DiaryActionButtons';
import DiaryImageCarousel from '@/components/diary/DiaryImageCarousel';
import ShareModal from '@/components/diary/ShareModal';
import { Colors } from '@/constants/theme';
import * as imageService from '@/services/imageService';
import { diaryModalMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import ViewShot from 'react-native-view-shot';

const RETURN_ICON_URL = 'http://39.103.63.159/api/files/xiaoman-icon-return.png';

interface DiaryGenerateModalProps {
  visible: boolean;
  content: string;
  imageUrl?: string; // 兼容旧版本，单张图片
  imageUrls?: string[]; // 图片列表（新版本，支持多张）
  isGenerating: boolean;
  onClose: () => void;
  gmt_create?: string; // 创建时间
  diaryId?: string; // 日记ID（用于编辑和导出）
}

// 格式化日期：Date 2025/12/25
const formatDate = (gmt_create?: string): string => {
  if (!gmt_create) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `Date ${year}/${month}/${day}`;
  }
  
  try {
    const date = new Date(gmt_create);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `Date ${year}/${month}/${day}`;
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `Date ${year}/${month}/${day}`;
  }
};

export default function DiaryGenerateModal({
  visible,
  content,
  imageUrl,
  imageUrls = [],
  isGenerating,
  onClose,
  gmt_create,
  diaryId,
}: DiaryGenerateModalProps) {
  const router = useRouter();
  const displayedTextRef = useRef<string>('');
  const targetTextRef = useRef<string>('');
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [enableMarkdown, setEnableMarkdown] = useState(true); // 调试开关：是否启用 markdown
  const [sharing, setSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [localScreenshotUri, setLocalScreenshotUri] = useState<string | null>(null);
  const contentViewRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // 更新目标文本（当 content 变化时，实时更新）
  useEffect(() => {
    if (visible) {
      targetTextRef.current = content || '';
    } else {
      targetTextRef.current = '';
      displayedTextRef.current = '';
      setDisplayedContent('');
    }
  }, [content, visible]);

  // 打字机效果
  useEffect(() => {
    if (!visible) {
      displayedTextRef.current = '';
      targetTextRef.current = '';
      setDisplayedContent('');
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      return;
    }

    // 重置显示状态
    displayedTextRef.current = '';
    setDisplayedContent('');

    // 启动打字机效果
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
    }

    typewriterTimerRef.current = setInterval(() => {
      // 每次从 ref 中获取最新的目标文本
      const targetText = targetTextRef.current;
      const currentDisplay = displayedTextRef.current;

      // 如果目标文本比当前显示文本长，继续显示下一个字符
      if (targetText.length > currentDisplay.length) {
        const nextChar = targetText[currentDisplay.length];
        displayedTextRef.current = currentDisplay + nextChar;
        setDisplayedContent(displayedTextRef.current);
      }
      // 注意：不在这里停止定时器，让它在流式数据到达时继续运行
    }, 20); // 每20ms显示一个字符

    return () => {
      // 清理定时器
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };
  }, [visible]);

  // 处理编辑
  const handleEdit = () => {
    if (!diaryId) {
      Alert.alert('提示', '日记尚未保存，无法编辑');
      return;
    }
    onClose();
    router.push(`/diary-edit?diaryId=${diaryId}` as any);
  };

  // 处理导出/分享 - 截图并上传
  const handleExport = async () => {
    if (!contentViewRef.current) {
      Alert.alert('提示', '内容未准备好');
      return;
    }

    try {
      setSharing(true);

      // 滚动到顶部，确保从开始截图
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }

      // 等待内容渲染和滚动完成
      await new Promise(resolve => setTimeout(resolve, 500));

      // 截图整个内容区域
      if (!contentViewRef.current || !contentViewRef.current.capture) {
        throw new Error('ViewShot ref not available');
      }
      const uri = await contentViewRef.current.capture();

      // 保存本地URI用于保存到相册
      setLocalScreenshotUri(uri);

      // 上传截图
      const uploadResult = await imageService.uploadImage(uri);
      setScreenshotUri(uploadResult.url);

      // 显示分享弹窗
      setShowShareModal(true);
    } catch (error: any) {
      console.error('截图或上传失败:', error);
      Alert.alert('错误', error.message || '截图失败，请重试');
    } finally {
      setSharing(false);
    }
  };

  // 保存图片到相册
  const handleSaveImage = async () => {
    if (!localScreenshotUri) {
      Alert.alert('提示', '图片未准备好');
      return;
    }

    try {
      // 请求相册权限
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要相册权限才能保存图片');
        return;
      }

      // 保存到相册
      await MediaLibrary.createAssetAsync(localScreenshotUri);
      
      Alert.alert('成功', '图片已保存到相册');
    } catch (error: any) {
      console.error('保存图片失败:', error);
      Alert.alert('错误', error.message || '保存图片失败，请重试');
    }
  };

  if (!visible) return null;

  const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
  // 图片列表：优先 imageUrls，兼容单张 imageUrl
  const carouselImageUrls = imageUrls && imageUrls.length > 0
    ? imageUrls
    : imageUrl
      ? [imageUrl]
      : [];
  const dateStr = formatDate(gmt_create);
  
  // 渲染日记内容（支持 markdown）
  const renderDiaryContent = () => {
    if (isGenerating && displayedContent.length === 0) {
      return (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="small" color={Colors.light.tint} style={{ marginRight: scaleSize(8) }} />
          <Text style={styles.generatingText}>正在生成中...</Text>
        </View>
      );
    }
    
    if (!displayedContent || displayedContent.trim() === '') {
      return null;
    }
    
    return (
      <View style={styles.diaryContentWrapper}>
        {enableMarkdown ? (
          <Markdown style={diaryModalMarkdownStyles}>
            {displayedContent}
          </Markdown>
        ) : (
          <Text style={styles.diaryText}>{displayedContent}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton} disabled={isGenerating}>
              <Image
                source={{ uri: RETURN_ICON_URL }}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>日记</Text>
            <TouchableOpacity
              onPress={() => setEnableMarkdown(!enableMarkdown)}
              style={[
                styles.debugToggle,
                enableMarkdown ? styles.debugToggleActive : styles.debugToggleInactive,
              ]}
              disabled={isGenerating}
            >
              <Text style={styles.debugToggleText}>
                {enableMarkdown ? 'MD' : 'TXT'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 日记区域 */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContainer} 
            showsVerticalScrollIndicator={true}
          >
            {/* 日记内容区域 - 用于截图 */}
            <ViewShot
              ref={contentViewRef}
              options={{ format: 'png', quality: 1, result: 'tmpfile' }}
              style={styles.contentView}
            >
              <View style={styles.diaryContainer}>
                {/* 日期区域 */}
                <Text style={styles.dateText}>{dateStr}</Text>
                
                {/* 图片区域 - 公共轮播组件 */}
                {carouselImageUrls.length > 0 && (
                  <DiaryImageCarousel
                    imageUrls={carouselImageUrls}
                    apiUrl={apiUrl}
                    showIndicator={false}
                  />
                )}

                {/* 日记内容区域 */}
                <View style={styles.diaryContentContainer}>
                  {renderDiaryContent()}
                </View>
              </View>
            </ViewShot>

            {/* 操作区域 - 公共按钮组件 */}
            <DiaryActionButtons
              onEdit={handleEdit}
              onExport={handleExport}
              editDisabled={isGenerating || !diaryId}
              exportDisabled={isGenerating}
              exportLoading={sharing}
              exportLabel="导出"
            />
          </ScrollView>

          {/* 分享弹窗 */}
          <ShareModal
            visible={showShareModal}
            imageUri={screenshotUri || undefined}
            onClose={() => setShowShareModal(false)}
            onSaveImage={handleSaveImage}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background,
    zIndex: 9999,
  },
  safeArea: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  title: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
  },
  headerRight: {
    width: scaleSize(40),
  },
  debugToggle: {
    width: scaleSize(40),
    height: scaleSize(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scaleSize(8),
  },
  debugToggleActive: {
    backgroundColor: '#4CAF50',
  },
  debugToggleInactive: {
    backgroundColor: '#FF9800',
  },
  debugToggleText: {
    fontSize: scaleSize(12),
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'PingFang SC',
  },
  scrollContainer: {
    flex: 1,
  },
  contentView: {
    backgroundColor: 'transparent',
  },
  diaryContainer: {
    marginHorizontal: scaleSize(16),
    flex: 1,
    backgroundColor: '#FFFEFC',
    borderRadius: scaleSize(8),
    paddingTop: scaleSize(20),
  },
  dateText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
    paddingHorizontal: scaleSize(20),
  },
  diaryContentContainer: {
    marginTop: scaleSize(20),
    paddingHorizontal: scaleSize(20),
    paddingBottom: scaleSize(20),
  },
  diaryContentWrapper: {
    width: '100%',
  },
  diaryText: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(22),
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scaleSize(20),
  },
  generatingText: {
    fontSize: scaleSize(14),
    color: Colors.light.icon,
    fontFamily: 'PingFang SC',
  },
});

