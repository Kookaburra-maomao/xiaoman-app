import AsyncStorage from '@react-native-async-storage/async-storage';

const UNREAD_COUNT_KEY = 'chat_unread_count';
const PENDING_MESSAGES_KEY = 'chat_pending_messages';

// 获取未读消息数量
export const getUnreadCount = async (): Promise<number> => {
  try {
    const count = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
    return 0;
  }
};

// 增加未读消息数量
export const incrementUnreadCount = async (): Promise<number> => {
  try {
    const currentCount = await getUnreadCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(UNREAD_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('增加未读消息数量失败:', error);
    return 0;
  }
};

// 清除未读消息数量
export const clearUnreadCount = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(UNREAD_COUNT_KEY);
  } catch (error) {
    console.error('清除未读消息数量失败:', error);
  }
};

// 添加待发送的消息
export const addPendingMessage = async (message: string): Promise<void> => {
  try {
    const messages = await getPendingMessages();
    messages.push(message);
    await AsyncStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('添加待发送消息失败:', error);
  }
};

// 获取待发送的消息列表
export const getPendingMessages = async (): Promise<string[]> => {
  try {
    const messages = await AsyncStorage.getItem(PENDING_MESSAGES_KEY);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('获取待发送消息失败:', error);
    return [];
  }
};

// 清除待发送的消息列表
export const clearPendingMessages = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_MESSAGES_KEY);
  } catch (error) {
    console.error('清除待发送消息失败:', error);
  }
};

// 添加待发送的对话（用户消息和系统回复）
const PENDING_CONVERSATIONS_KEY = 'chat_pending_conversations';

interface PendingConversation {
  userMessage: string;
  systemMessage: string;
  userImageUrl?: string; // 用户消息的图片URL（可选）
}

export const addPendingConversation = async (userMessage: string, systemMessage: string, userImageUrl?: string): Promise<void> => {
  try {
    const conversations = await getPendingConversations();
    conversations.push({ userMessage, systemMessage, userImageUrl });
    await AsyncStorage.setItem(PENDING_CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('添加待发送对话失败:', error);
  }
};

export const getPendingConversations = async (): Promise<PendingConversation[]> => {
  try {
    const conversations = await AsyncStorage.getItem(PENDING_CONVERSATIONS_KEY);
    return conversations ? JSON.parse(conversations) : [];
  } catch (error) {
    console.error('获取待发送对话失败:', error);
    return [];
  }
};

export const clearPendingConversations = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_CONVERSATIONS_KEY);
  } catch (error) {
    console.error('清除待发送对话失败:', error);
  }
};

// 对话历史记录存储
const ASSISTANT_HISTORY_KEY = 'chat_assistant_history';

// 对话历史记录项的类型定义
export interface AssistantHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

// 获取对话历史记录
export const getAssistantHistory = async (): Promise<AssistantHistoryItem[]> => {
  try {
    const history = await AsyncStorage.getItem(ASSISTANT_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('获取对话历史记录失败:', error);
    return [];
  }
};

// 保存对话历史记录
export const saveAssistantHistory = async (history: AssistantHistoryItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ASSISTANT_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('保存对话历史记录失败:', error);
  }
};

// 添加对话历史记录项
export const addAssistantHistoryItem = async (item: AssistantHistoryItem): Promise<void> => {
  try {
    const history = await getAssistantHistory();
    history.push(item);
    await saveAssistantHistory(history);
  } catch (error) {
    console.error('添加对话历史记录项失败:', error);
  }
};

// 清除对话历史记录
export const clearAssistantHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ASSISTANT_HISTORY_KEY);
  } catch (error) {
    console.error('清除对话历史记录失败:', error);
  }
};

