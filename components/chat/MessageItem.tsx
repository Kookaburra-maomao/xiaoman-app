/**
 * 消息项组件
 */

import { Colors } from '@/constants/theme';
import { Message } from '@/types/chat';
import { Image, StyleSheet, Text, View } from 'react-native';
import DiaryCard from './DiaryCard';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  return (
    <View
      style={[
        styles.messageItem,
        message.type === 'user' ? styles.messageItemUser : styles.messageItemSystem,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.type === 'user' ? styles.messageBubbleUser : styles.messageBubbleSystem,
          message.recordType === 'diary' && styles.messageBubbleDiary,
        ]}
      >
        {message.recordType === 'diary' && message.diaryData ? (
          <DiaryCard context={message.diaryData.context} pic={message.diaryData.pic} />
        ) : message.imageUrl ? (
          <Image
            source={{ uri: message.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text
            style={[
              styles.messageText,
              message.type === 'user' ? styles.messageTextUser : styles.messageTextSystem,
            ]}
          >
            {message.text || (message.type === 'system' ? '正在输入...' : '')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageItemUser: {
    justifyContent: 'flex-end',
  },
  messageItemSystem: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleUser: {
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 4,
  },
  messageBubbleSystem: {
    backgroundColor: '#F5F5F5',
    borderBottomLeftRadius: 4,
  },
  messageBubbleDiary: {
    maxWidth: '100%',
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextSystem: {
    color: Colors.light.text,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
});

