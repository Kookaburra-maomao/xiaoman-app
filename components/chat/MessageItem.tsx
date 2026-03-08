/**
 * 消息项组件
 */

import { Colors } from '@/constants/theme';
import { Message } from '@/types/chat';
import { defaultMarkdownStyles } from '@/utils/markdownStyles';
import { scaleSize } from '@/utils/screen';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import DiaryCard from './DiaryCard';
import ImagePreviewModal from './ImagePreviewModal';

interface MessageItemProps {
  message: Message;
  userId?: string; // 用户ID，用于打点
}

export default function MessageItem({ message, userId }: MessageItemProps) {
  const [previewVisible, setPreviewVisible] = useState(false);
  // 判断消息类型
  const isDiary = message.recordType === 'diary' && message.diaryData;
  const isDiaryCard = isDiary; // 日记卡片（type 可能是 'user' 或 'system'）
  const isUserMessage = message.type === 'user' && !isDiary; // 用户消息（不包括日记卡片）
  const isSystemMessage = message.type === 'system' && !isDiary; // 系统消息（不包括日记卡片）
  
  // 根据消息类型确定容器样式
  const containerStyle = [
    styles.messageItem,
    isUserMessage && styles.messageItemUser,
    isSystemMessage && styles.messageItemSystem,
    isDiaryCard && styles.messageItemDiary,
  ];
  
  // 根据消息类型确定气泡样式
  const bubbleStyle = [
    !isDiaryCard && styles.messageBubble,
    isUserMessage && styles.messageBubbleUser,
    isSystemMessage && styles.messageBubbleSystem,
    isDiaryCard && styles.messageBubbleDiary,
    message.isError && styles.messageBubbleError,
  ];
  
  // 渲染内容
  const renderContent = () => {
    if (isDiaryCard && message.diaryData) {
      return (
        <DiaryCard 
          context={message.diaryData.context} 
          pic={message.diaryData.pic} 
          gmt_create={message.diaryData.gmt_create}
          diaryId={message.diaryData.id}
          userId={userId}
        />
      );
    }
    
    if (message.imageUrl) {
      return (
        <>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setPreviewVisible(true)}
          >
            <Image
              source={{ uri: message.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          
          <ImagePreviewModal
            visible={previewVisible}
            imageUrl={message.imageUrl}
            onClose={() => setPreviewVisible(false)}
          />
        </>
      );
    }
    
    return (
      <>
        {isSystemMessage ? (
          // 系统消息使用 Markdown 渲染
          <Markdown style={defaultMarkdownStyles}>
            {message.text || '正在输入...'}
          </Markdown>
        ) : (
          // 用户消息使用普通 Text
          <Text
            style={[
              styles.messageText,
              styles.messageTextUser,
              message.isError && styles.messageTextError,
            ]}
            selectable={true}
          >
            {message.text || ''}
          </Text>
        )}
      </>
    );
  };
  
  return (
    <View style={containerStyle}>
      <View style={bubbleStyle}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageItem: {
    flexDirection: 'row',
    marginBottom: scaleSize(0),
  },
  messageItemUser: {
    justifyContent: 'flex-end',
    paddingRight: scaleSize(20),
  },
  messageItemSystem: {
    justifyContent: 'flex-start',
    paddingLeft: scaleSize(20),
  },
  messageItemDiary: {
    paddingLeft: scaleSize(20),
    paddingRight: scaleSize(20),
    width: '100%',
    alignSelf: 'stretch',
  },
  messageBubble: {
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(10),
    borderRadius: scaleSize(16),
  },
  messageBubbleUser: {
    maxWidth: '75%',
    // backgroundColor: Colors.light.tint,
    borderRadius: scaleSize(12),
    paddingTop: scaleSize(8),
    paddingRight: scaleSize(12),
    paddingBottom: scaleSize(8),
    paddingLeft: scaleSize(12),
    backgroundColor: Colors.light.highlight,
  },
  messageBubbleSystem: {
    backgroundColor: Colors.light.background,
    borderBottomLeftRadius: scaleSize(4),
    paddingRight: scaleSize(12),
    paddingLeft: 0,
  },
  messageBubbleDiary: {
    width: '100%',
    maxWidth: '100%',
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  messageText: {
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
  },
  messageTextUser: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    letterSpacing: 0,
    color: '#222222',
    backgroundColor: Colors.light.highlight,
  },
  messageTextSystem: {
    color: Colors.light.text,
  },
  messageImage: {
    width: scaleSize(200),
    height: scaleSize(200),
    borderRadius: scaleSize(12),
  },
  messageBubbleError: {
    backgroundColor: '#FFE5E5',
    borderWidth: scaleSize(1),
    borderColor: '#FF4444',
  },
  messageTextError: {
    color: '#FF4444',
  },
});

