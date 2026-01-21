/**
 * 日记生成弹窗组件
 */

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image, ActivityIndicator } from 'react-native';

interface DiaryGenerateModalProps {
  visible: boolean;
  content: string;
  imageUrl?: string;
  isGenerating: boolean;
  onClose: () => void;
}

export default function DiaryGenerateModal({
  visible,
  content,
  imageUrl,
  isGenerating,
  onClose,
}: DiaryGenerateModalProps) {
  const displayedTextRef = useRef<string>('');
  const targetTextRef = useRef<string>('');
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayedContent, setDisplayedContent] = useState('');

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

  if (!visible) return null;

  const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${apiUrl}${imageUrl}`) : undefined;

  return (
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        {/* 标题栏 */}
        <View style={styles.header}>
          <Text style={styles.title}>生成日记</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isGenerating}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* 内容区域 */}
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={true}>
          {/* 图片 */}
          {fullImageUrl && (
            <Image source={{ uri: fullImageUrl }} style={styles.diaryImage} resizeMode="cover" />
          )}

          {/* 日记内容 */}
          <View style={styles.textContainer}>
            {isGenerating && displayedContent.length === 0 ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator size="small" color={Colors.light.tint} style={{ marginRight: 8 }} />
                <Text style={styles.generatingText}>正在生成中...</Text>
              </View>
            ) : null}
            <Text style={styles.diaryText}>{displayedContent}</Text>
          </View>
        </ScrollView>
      </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    width: '95%',
    height: '90%',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  diaryImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  textContainer: {
    padding: 20,
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  generatingText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  diaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
  },
});

