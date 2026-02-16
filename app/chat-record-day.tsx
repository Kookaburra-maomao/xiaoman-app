/**
 * 当天对话记录页面
 * 只展示对话记录，不支持聊天
 */

import { Colors } from '@/constants/theme';
import { ICON_RETURN_URL } from '@/constants/urls';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRecord, getChatRecords } from '@/services/chatService';
import { scaleSize } from '@/utils/screen';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export default function DayChatRecordScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const [records, setRecords] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  // 格式化时间显示
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 获取对话记录
  const fetchChatRecords = async () => {
    if (!user?.id || !date) return;

    try {
      setLoading(true);
      // 构建当天的开始和结束时间
      const startTime = `${date} 00:00:00`;
      const endTime = `${date} 23:59:59`;
      
      const data = await getChatRecords(user.id, startTime, endTime);
      // 过滤掉类型为 diary 的对话记录
      const filteredData = data.filter(record => record.type !== 'diary');
      setRecords(filteredData);
    } catch (error) {
      console.error('获取对话记录失败:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatRecords();
  }, [user?.id, date]);

  // 渲染单条消息
  const renderMessage = (record: ChatRecord) => {
    const isUser = record.chat_from === 'user';
    
    // 判断是否是图片消息
    const isImage = record.type === 'image';
    
    return (
      <View
        key={record.id}
        style={[
          styles.messageItem,
          isUser ? styles.messageItemUser : styles.messageItemSystem,
        ]}
      >
        {/* 只为用户消息显示时间戳（在气泡上方） */}
        {isUser && (
          <Text style={styles.messageTimestamp}>
            {formatTime(record.gmt_create)}
          </Text>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.messageBubbleUser : styles.messageBubbleSystem,
          ]}
        >
          {isImage ? (
            // 图片消息
            <Image
              source={{
                uri: record.chat_context.startsWith('http')
                  ? record.chat_context
                  : `${apiUrl}${record.chat_context}`,
              }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            // 文字消息
            <Text
              style={[
                styles.messageText,
                isUser ? styles.messageTextUser : styles.messageTextSystem,
              ]}
            >
              {record.chat_context}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={{ uri: ICON_RETURN_URL }}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {date ? `${formatDate(date)}的对话` : '对话记录'}
        </Text>
        <View style={styles.backButton} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>这一天还没有对话记录</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {records.map(renderMessage)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,

  },
  backIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  messageItem: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  messageItemUser: {
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  messageItemSystem: {
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  messageTimestamp: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    textAlign: 'center',
  },
  messageBubble: {
    borderRadius: 12,
  },
  messageBubbleUser: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 12,
    backgroundColor: Colors.light.highlight,
  },
  messageBubbleSystem: {
    backgroundColor: Colors.light.background,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextUser: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#222222',
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
