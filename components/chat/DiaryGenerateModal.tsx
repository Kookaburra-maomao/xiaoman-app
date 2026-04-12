/**
 * 日记生成弹窗组件
 */

import DiaryActionButtons from '@/components/diary/DiaryActionButtons';
import DiaryCardContent from '@/components/diary/DiaryCardContent';
import DiaryImageCarousel from '@/components/diary/DiaryImageCarousel';
import DiaryStylePicker from '@/components/diary/DiaryStylePicker';
import { Colors } from '@/constants/theme';
import { RETURN_ICON_URL } from '@/constants/urls';
import { useAuth } from '@/hooks/useAuth';
import { useLog } from '@/hooks/useLog';
import { DiaryTemplate, generateBeautifiedDiary, getDiaryDetail, getTodayBeautifyCount, recordTemplateUse } from '@/services/chatService';
import { getLocationAndWeather } from '@/services/locationService';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ViewShot from 'react-native-view-shot';
import MarkdownText from '../common/MarkdownText';
import Toast from '../common/Toast';

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

// 格式化日期：YYYY/MM/DD
const formatDate = (gmt_create?: string): string => {
  const date = gmt_create ? new Date(gmt_create) : new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// 格式化时间：星期日 16:33
const formatTime = (gmt_create?: string): string => {
  const date = gmt_create ? new Date(gmt_create) : new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekday = weekdays[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `星期${weekday} ${hours}:${minutes}`;
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
  const { log } = useLog();
  const { user } = useAuth();
  const displayedTextRef = useRef<string>('');
  const targetTextRef = useRef<string>('');
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const [typewriterComplete, setTypewriterComplete] = useState(false); // 打字机效果是否完成
  const [enableMarkdown, setEnableMarkdown] = useState(true); // 调试开关：是否启用 markdown
  const contentViewRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [city, setCity] = useState<string>('');
  const [weather, setWeather] = useState<string>('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [beautifyCount, setBeautifyCount] = useState(0);

  // 判断是否为 VIP 用户
  const isVip = (user?.is_vip ?? '').toString() === '1' && user?.vip_expire_time && new Date(user.vip_expire_time).getTime() > Date.now();
  // 判断流式展示是否完成（需要等待打字机效果完成）
  const isStreamingComplete = !isGenerating && typewriterComplete && displayedContent === content && content.length > 0;

  // 页面曝光打点 + 查询美化次数
  useEffect(() => {
    if (visible) {
      log('DIARY_PREVIEW_EXPO');
      if (user?.id) {
        getTodayBeautifyCount(user.id).then(setBeautifyCount).catch(() => {});
      }
    }
  }, [visible]);

  // 当流式展示完成时显示 Toast
  useEffect(() => {
    if (isStreamingComplete && visible) {
      setToastMessage('日记生成完成');
      setToastVisible(true);
    }
  }, [isStreamingComplete, visible]);

  // 获取位置和天气信息
  useEffect(() => {
    if (visible) {
      // 每次弹窗打开时获取位置和天气
      getLocationAndWeather().then(({ city: fetchedCity, weather: fetchedWeather }) => {
        setCity(fetchedCity);
        setWeather(fetchedWeather);
      }).catch((error) => {
        console.error('获取位置和天气失败:', error);
        setCity('');
        setWeather('');
      });
    } else {
      // 弹窗关闭时清空
      setCity('');
      setWeather('');
    }
  }, [visible]);

  // 更新目标文本（当 content 变化时，实时更新）
  useEffect(() => {
    if (visible) {
      targetTextRef.current = content || '';
      setTypewriterComplete(false); // 重置打字机完成状态
    } else {
      targetTextRef.current = '';
      displayedTextRef.current = '';
      setDisplayedContent('');
      setTypewriterComplete(false);
    }
  }, [content, visible]);

  // 打字机效果
  useEffect(() => {
    if (!visible) {
      displayedTextRef.current = '';
      targetTextRef.current = '';
      setDisplayedContent('');
      setTypewriterComplete(false);
      if (typewriterTimerRef.current) {
        clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      return;
    }

    // 重置显示状态
    displayedTextRef.current = '';
    setDisplayedContent('');
    setTypewriterComplete(false);

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
        
        // 检查是否已经显示完所有字符
        if (displayedTextRef.current.length === targetText.length && targetText.length > 0) {
          setTypewriterComplete(true);
        }
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

  // 处理导出/分享 - 改为美化日记
  const handleExport = () => {
    if (!diaryId) {
      Alert.alert('提示', '日记尚未保存，无法美化');
      return;
    }
    setShowStylePicker(true);
  };

  // 美化日记
  const handleBeautify = async (template: DiaryTemplate) => {
    if (!diaryId) return;
    setShowStylePicker(false);

    // VIP 检查
    if (!isVip && beautifyCount >= 5) {
      Alert.alert('提示', '每天只能生成5篇美化日记哦~');
      return;
    }

    setIsBeautifying(true);
    recordTemplateUse(template.id);

    try {
      const diaryDetail = await getDiaryDetail(diaryId);
      const pics = diaryDetail?.pic ? (() => {
        try { const p = JSON.parse(diaryDetail.pic!); return Array.isArray(p) ? p : []; } catch { return []; }
      })() : [];
      const date = new Date(gmt_create || Date.now());
      const dateStr2 = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

      const html = await generateBeautifiedDiary({
        template_id: template.id,
        diary_content: content,
        pics,
        city: city || '',
        date: dateStr2,
        weather: weather || '',
      });

      await AsyncStorage.setItem('@beautify_html', html);
      setBeautifyCount(prev => prev + 1);
      onClose();
      router.push(`/diary-beautify?diaryId=${diaryId}&templateId=${template.id}&userId=${user?.id}` as any);
    } catch (e: any) {
      Alert.alert('错误', e.message || '美化日记失败');
    } finally {
      setIsBeautifying(false);
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
          <Text style={styles.generatingText} allowFontScaling={false}>正在生成中...</Text>
        </View>
      );
    }
    
    if (!displayedContent || displayedContent.trim() === '') {
      return null;
    }
    
    return (
      <View style={styles.diaryContentWrapper}>
        {enableMarkdown ? (
          <MarkdownText style={defaultMarkdownStyles}>
            {displayedContent}
          </MarkdownText>
        ) : (
          <Text style={styles.diaryText} allowFontScaling={false}>{displayedContent}</Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
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
            <Text style={styles.title} allowFontScaling={false}>日记</Text>
            <TouchableOpacity
              onPress={() => setEnableMarkdown(!enableMarkdown)}
              style={[
                styles.debugToggle,
                enableMarkdown ? styles.debugToggleActive : styles.debugToggleInactive,
              ]}
              disabled={isGenerating}
            >
              <Text style={styles.debugToggleText} allowFontScaling={false}>
                {enableMarkdown ? '' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 日记区域 */}
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContainer} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* 日记内容区域 - 用于截图 */}
            <ViewShot
              ref={contentViewRef}
              options={{ format: 'png', quality: 1, result: 'tmpfile' }}
              style={styles.contentView}
            >
              <DiaryCardContent
                date={dateStr}
                weather={weather}
                weekdayTime={formatTime(gmt_create)}
                city={city}
                imageContent={carouselImageUrls.length > 0 ? (
                  <DiaryImageCarousel
                    imageUrls={carouselImageUrls}
                    apiUrl={apiUrl}
                    showIndicator={false}
                  />
                ) : undefined}
                diaryContent={renderDiaryContent()}
              />
            </ViewShot>
          </ScrollView>

          {/* 操作区域 - 悬浮吸底按钮组件（仅在流式展示完成后显示） */}
          {isStreamingComplete && (
            <View style={styles.actionButtonsContainer}>
              <DiaryActionButtons
                onEdit={handleEdit}
                onExport={handleExport}
                editDisabled={isGenerating || !diaryId}
                exportDisabled={isGenerating}
                exportLabel="美化日记"
                exportIcon="http://xiaomanriji.com/api/files/xiaoman-icon-beauty.png"
                userId={user?.id}
              />
            </View>
          )}

          {/* 日记风格选择浮层 */}
          <DiaryStylePicker
            visible={showStylePicker}
            onClose={() => setShowStylePicker(false)}
            onSelect={handleBeautify}
            todayCount={beautifyCount}
            isVip={!!isVip}
          />

          {/* 美化日记 loading 浮层 */}
          {isBeautifying && (
            <View style={styles.beautifyOverlay}>
              <LottieView
                source={require('@/assets/animations/beautify-loading.json')}
                autoPlay
                loop
                style={styles.beautifyLottie}
              />
              <Text style={styles.beautifyLoadingText} allowFontScaling={false}>魔法加载中，预计等候30秒... 请不要离开app</Text>
            </View>
          )}

          {/* Toast 提示 */}
          <Toast
            visible={toastVisible}
            message={toastMessage}
            onHide={() => setToastVisible(false)}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
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
    flex: 1,
    width: scaleSize(100),
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
    textAlign: 'center',
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
  },
  debugToggleInactive: {
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
  scrollContent: {
    paddingBottom: scaleSize(100), // 为底部按钮留出空间
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingBottom: scaleSize(20),
    paddingTop: scaleSize(12),
    borderTopWidth: scaleSize(1),
    borderTopColor: '#F0F0F0',
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
  dateWeatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSize(20),
  },
  dateText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
  },
  weatherText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: '#999999',
    fontFamily: 'PingFang SC',
  },
  timeContainer: {
    marginTop: scaleSize(16),
    paddingHorizontal: scaleSize(20),
  },
  timeText: {
    fontSize: scaleSize(18),
    color: '#222222',
    fontFamily: 'PingFang SC',
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
  beautifyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241,241,241,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  beautifyLottie: {
    width: scaleSize(96),
    height: scaleSize(99),
  },
  beautifyLoadingText: {
    marginTop: scaleSize(32),
    fontSize: scaleSize(14),
    color: '#666666',
  },
});

