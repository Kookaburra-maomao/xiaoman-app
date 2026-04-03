/**
 * 对话相关业务逻辑Hook
 */

import { useAuth } from '@/hooks/useAuth';
import { useTypewriter } from '@/hooks/useTypewriter';
import * as chatService from '@/services/chatService';
import * as imageService from '@/services/imageService';
import { getCurrentLocation, getLocationAndWeather } from '@/services/locationService';
import { logByPosition } from '@/services/logService';
import { checkUsageLimit } from '@/services/usageLimitService';
import { Message } from '@/types/chat';
import { AssistantHistoryItem, clearAssistantHistory, clearPendingConversations, clearPendingMessages, clearUnreadCount, getAssistantHistory, getPendingConversations, getPendingMessages, saveAssistantHistory } from '@/utils/unread-messages';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export const useChat = (scrollViewRef?: RefObject<any>) => {
  const { user } = useAuth();

  // 格式化时间为 MM-DD HH:mm
  const formatTimeHHmm = (date: Date = new Date()): string => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${min}`;
  };
  
  // 监听 user 变化
  useEffect(() => {
    console.log('[useChat] User 状态:', user ? { id: user.id, username: user.username } : null);
  }, [user]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantHistory, setAssistantHistory] = useState<AssistantHistoryItem[]>([]);
  const [assistantEmoji, setAssistantEmoji] = useState<string>(''); // 当前心情emoji
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [diaryContent, setDiaryContent] = useState('');
  const [diaryImageUrl, setDiaryImageUrl] = useState<string | undefined>(undefined);
  const [currentDiaryId, setCurrentDiaryId] = useState<string | null>(null);
  const [imageList, setImageList] = useState<string[]>([]); // 图片列表，最多保存3张
  const [diaryImageList, setDiaryImageList] = useState<string[]>([]); // 生成日记时的图片列表快照
  const [userMemory, setUserMemory] = useState<string>(''); // 用户长期记忆
  const hasLoadedHistoryRef = useRef(false); // 标记是否已加载过历史记录
  const hasLoadedMemoryRef = useRef(false); // 标记是否已加载过用户记忆
  const currentSystemMessageRef = useRef<string>('');
  const hasMoreHistoryRef = useRef(false); // 是否还有更早的历史记录
  const nextBeforeIdRef = useRef<string | null>(null); // 下次加载的游标
  const isLoadingMoreRef = useRef(false); // 是否正在加载更多
  const [isLoadingMore, setIsLoadingMore] = useState(false); // 加载更多状态
  const [hasMoreHistory, setHasMoreHistory] = useState(false); // 是否还有更多历史

  // 打字机效果更新回调
  const handleTypewriterUpdate = useCallback((messageId: string, text: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId
          ? { ...msg, text }
          : msg
      )
    );
  }, []);

  const {
    displayedTextRef,
    targetTextRef,
    typewriterMessageIdRef,
    stopTypewriter,
    startTypewriter,
    updateTypewriterTarget,
    waitForTypewriter,
    resetTypewriter,
  } = useTypewriter(handleTypewriterUpdate);

  // 滚动到底部
  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (scrollViewRef?.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated });
      }, 100);
    }
  }, [scrollViewRef]);

  // 加载待发送消息
  const loadPendingMessages = useCallback(async () => {
    try {
      // 首先检查待发送的对话（用户消息+系统回复）
      const pendingConversations = await getPendingConversations();
      if (pendingConversations.length > 0) {
        for (const conversation of pendingConversations) {
          // 显示用户消息（可能是文本或图片）
          const userMessageId = (Date.now() + Math.random()).toString();
          if (conversation.userImageUrl) {
            // 图片消息
            setMessages((prev) => [
              ...prev,
              { id: userMessageId, type: 'user', text: '', imageUrl: conversation.userImageUrl, timestamp: formatTimeHHmm() },
            ]);
            setAssistantHistory((prev) => {
              const newHistory = [...prev, { role: 'user' as const, content: '[图片]' }];
              saveAssistantHistory(newHistory);
              return newHistory;
            });
          } else if (conversation.userMessage) {
            // 文本消息
            setMessages((prev) => [
              ...prev,
              { id: userMessageId, type: 'user', text: conversation.userMessage, timestamp: formatTimeHHmm() },
            ]);
            setAssistantHistory((prev) => {
              const newHistory = [...prev, { role: 'user' as const, content: conversation.userMessage }];
              saveAssistantHistory(newHistory);
              return newHistory;
            });
          }

          // 显示系统回复（如果有）
          if (conversation.systemMessage) {
            const systemMessageId = (Date.now() + Math.random() + 1).toString();
            setMessages((prev) => [
              ...prev,
              { id: systemMessageId, type: 'system', text: conversation.systemMessage },
            ]);
            setAssistantHistory((prev) => {
              const newHistory = [...prev, { role: 'assistant' as const, content: conversation.systemMessage }];
              saveAssistantHistory(newHistory);
              return newHistory;
            });
          }
        }
        // 清除待发送对话
        await clearPendingConversations();
        // 清除未读消息数量
        await clearUnreadCount();
      }

      // 然后检查旧的待发送消息（兼容旧逻辑）
      const pendingMessages = await getPendingMessages();
      if (pendingMessages.length > 0) {
        // 显示所有待发送的消息
        for (const messageText of pendingMessages) {
          const messageId = Date.now().toString() + Math.random().toString();
          setMessages((prev) => [
            ...prev,
            { id: messageId, type: 'system', text: messageText },
          ]);
          // 添加到历史记录
          setAssistantHistory((prev) => {
            const newHistory = [...prev, { role: 'assistant' as const, content: messageText }];
            saveAssistantHistory(newHistory);
            return newHistory;
          });
        }
        // 清除待发送消息
        await clearPendingMessages();
        // 清除未读消息数量
        await clearUnreadCount();
      }
    } catch (error) {
      console.error('检查待发送消息失败:', error);
    }
  }, []);

  // 初始化时加载assistantHistory
  useEffect(() => {
    const loadHistory = async () => {
      const history = await getAssistantHistory();
      setAssistantHistory(history);
    };
    loadHistory();
  }, []);

  // 同步assistantHistory到AsyncStorage
  useEffect(() => {
    saveAssistantHistory(assistantHistory);
  }, [assistantHistory]);

  // 发送文本消息
  const sendMessage = useCallback(async (userContent: string, scrollToBottomFn?: () => void, skipSaveUserRecord?: boolean) => {
    console.log('[useChat] sendMessage 调用，user.id:', user?.id);
    
    if (!userContent.trim() || isSending || !user?.id) {
      console.log('[useChat] sendMessage 条件不满足:', { 
        hasContent: !!userContent.trim(), 
        isSending, 
        hasUserId: !!user?.id 
      });
      return;
    }

    // 检查今日对话次数限制
    const limitCheck = await checkUsageLimit(user.id, 'chat');
    if (!limitCheck.allowed) {
      Alert.alert('提示', limitCheck.message || '您已超过当日的体验次数');
      return;
    }

    const userMessageId = Date.now().toString();

    // 添加用户消息到界面
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, type: 'user', text: userContent, timestamp: formatTimeHHmm() },
    ]);

    // 添加到历史记录
    setAssistantHistory((prev) => {
      const newHistory = [...prev, { role: 'user' as const, content: userContent }];
      saveAssistantHistory(newHistory);
      return newHistory;
    });

    // 保存对话记录：用户发送文字消息（如果不需要跳过）
    if (!skipSaveUserRecord) {
      chatService.saveChatRecord(user.id, 'chat', 'user', userContent).catch(() => {
        // 静默处理错误
      });
    }

    setIsSending(true);
    if (scrollToBottomFn) scrollToBottomFn();

    // 创建系统消息占位，标记为流式传输中
    const systemMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: systemMessageId, type: 'system', text: '', isStreaming: true },
    ]);
    currentSystemMessageRef.current = '';
    displayedTextRef.current = '';
    targetTextRef.current = '';
    typewriterMessageIdRef.current = systemMessageId;
    stopTypewriter();

    // 立即启动打字机效果（即使还没有内容）
    startTypewriter();

    // 设置超时定时器（60秒）
    let timeoutTriggered = false;
    const timeoutId = setTimeout(() => {
      console.error('请求超时');
      timeoutTriggered = true;
      setIsSending(false);
      stopTypewriter();
      
      // 更新消息为错误状态
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === systemMessageId
            ? { ...msg, text: '请求超时，请重试', isStreaming: false, isError: true }
            : msg
        )
      );
      
      Alert.alert('提示', '请求超时，请检查网络连接后重试');
    }, 60000); // 60秒超时

    try {
      const history = await getAssistantHistory();
      
      // 获取当前位置
      const location = await getCurrentLocation();
      
      console.log('[useChat] 准备调用 sendChatMessage，userId:', user.id);
      
      // 打点：发送消息给模型
      if (user?.id) {
        logByPosition('SEND_MESSAGE', user.id);
      }
      
      // 发送消息，包含位置信息和用户记忆
      const fullText = await chatService.sendChatMessage(
        userContent, 
        user.id, 
        history,
        location || undefined,
        userMemory // 传递用户记忆
      );

      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 如果超时已触发，不再处理响应
      if (timeoutTriggered) {
        return;
      }

      // 使用打字机效果显示
      currentSystemMessageRef.current = fullText;
      updateTypewriterTarget(fullText, systemMessageId);

      // 等待打字机效果完成
      await waitForTypewriter();

      // 流式传输完成，标记消息为已完成
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === systemMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

      // 将完整的系统回复添加到历史记录
      setAssistantHistory((prev) => {
        const newHistory = [...prev, { role: 'assistant' as const, content: fullText }];
        saveAssistantHistory(newHistory);
        return newHistory;
      });

      // 保存对话记录：系统回复
      chatService.saveChatRecord(user.id, 'chat', 'system', fullText).catch(() => {
        // 静默处理错误
      });
    } catch (error: any) {
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 如果超时已触发，不再处理错误
      if (timeoutTriggered) {
        return;
      }
      
      console.error('发送消息失败:', error);
      
      // 更新消息为错误状态，而不是删除
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === systemMessageId
            ? { ...msg, text: error.message || '发送失败，请重试', isStreaming: false, isError: true }
            : msg
        )
      );
      
      Alert.alert('错误', error.message || '发送消息失败，请重试');
    } finally {
      setIsSending(false);
    }
  }, [isSending, user?.id, userMemory, stopTypewriter, startTypewriter, updateTypewriterTarget, waitForTypewriter]);

  // 上传图片并调用图片理解
  const uploadImageAndUnderstand = useCallback(async (imageUri: string, scrollToBottomFn?: () => void) => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    // 检查今日上传图片次数限制
    const limitCheck = await checkUsageLimit(user.id, 'image');
    if (!limitCheck.allowed) {
      Alert.alert('提示', limitCheck.message || '您已超过当日的体验次数');
      return;
    }

    // 检查并转换 HEIC 格式
    const { convertHeicToJpeg } = await import('@/utils/imageConverter');
    const convertedUri = await convertHeicToJpeg(imageUri);

    // 设置超时定时器（90秒，因为图片上传和理解需要更长时间）
    let timeoutTriggered = false;
    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      setIsSending(false);
      stopTypewriter();
      Alert.alert('提示', '图片上传超时，请检查网络连接后重试');
    }, 90000); // 90秒超时

    try {
      setIsSending(true);

      // 上传图片（使用转换后的 URI）
      const uploadResult = await imageService.uploadImage(convertedUri);
      const imageUrl = `${uploadResult.url}`;

      // 将图片添加到列表（最多3张，FIFO）
      setImageList((prev) => {
        const newList = [...prev, imageUrl];
        // 如果超过3张，移除最旧的
        return newList.slice(-3);
      });

      // 在右侧显示图片消息（用户消息）
      const imageMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: '',
        imageUrl: imageUrl,
        timestamp: formatTimeHHmm(),
      };

      setMessages((prev) => [...prev, imageMessage]);
      if (scrollToBottomFn) scrollToBottomFn();

      // 添加到历史记录
      setAssistantHistory((prev) => {
        const newHistory = [...prev, { role: 'user' as const, content: '[图片]' }];
        saveAssistantHistory(newHistory);
        return newHistory;
      });

      // 保存对话记录：用户上传图片
      chatService.saveChatRecord(user.id, 'image', 'user', imageUrl).catch(() => {
        // 静默处理错误
      });

      // 调用图片理解接口
      const history = await getAssistantHistory();
      const content = await chatService.callVL(imageUrl, user.id, history);

      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 如果超时已触发，不再处理响应
      if (timeoutTriggered) {
        return;
      }

      // 创建系统消息用于显示理解结果，标记为流式传输中
      const systemMessageId = `vl_${Date.now()}`;
      const systemMessage: Message = {
        id: systemMessageId,
        type: 'system',
        text: '',
        isStreaming: true,
      };

      setMessages((prev) => [...prev, systemMessage]);
      if (scrollToBottomFn) scrollToBottomFn();

      // 停止之前的打字机效果
      stopTypewriter();

      // 重置打字机状态
      displayedTextRef.current = '';
      targetTextRef.current = '';
      typewriterMessageIdRef.current = systemMessageId;

      // 立即启动打字机效果
      startTypewriter();

      // 使用打字机效果逐字显示内容
      const chars = content.split('');
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex < chars.length) {
          const partialText = content.substring(0, currentIndex + 1);
          updateTypewriterTarget(partialText, systemMessageId);
          currentIndex++;
        } else {
          clearInterval(typeInterval);

          // 等待打字机效果完成
          waitForTypewriter().then(() => {
            // 流式传输完成，标记消息为已完成
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === systemMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );

            // 将理解结果添加到历史记录
            setAssistantHistory((prev) => {
              const newHistory = [...prev, { role: 'assistant' as const, content: content }];
              saveAssistantHistory(newHistory);
              return newHistory;
            });

            // 保存对话记录：系统回复（图片理解结果）
            chatService.saveChatRecord(user.id, 'chat', 'system', content).catch(() => {
              // 静默处理错误
            });
          });
        }
      }, 20); // 每20ms更新一次目标文本
    } catch (error: any) {
      // 清除超时定时器
      clearTimeout(timeoutId);
      
      // 如果超时已触发，不再处理错误
      if (timeoutTriggered) {
        return;
      }
      
      console.error('上传图片或理解失败:', error);
      Alert.alert('错误', error.message || '图片上传或理解失败，请重试');

      // 移除失败的消息
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('vl_')));
      stopTypewriter();
    } finally {
      setIsSending(false);
    }
  }, [user?.id, stopTypewriter, startTypewriter, updateTypewriterTarget, waitForTypewriter]);

  // 初始化用户记忆
  const initUserMemory = useCallback(async () => {
    console.log('[initUserMemory] 被调用');
    console.log('[initUserMemory] user?.id:', user?.id);
    console.log('[initUserMemory] hasLoadedMemoryRef.current:', hasLoadedMemoryRef.current);
    console.log('[initUserMemory] 调用栈:', new Error().stack?.split('\n').slice(1, 5).join('\n'));
    
    if (!user?.id) {
      console.log('[initUserMemory] 跳过：没有 user.id');
      return;
    }
    
    if (hasLoadedMemoryRef.current) {
      console.log('[initUserMemory] 跳过：已加载过');
      return;
    }

    try {
      hasLoadedMemoryRef.current = true;
      console.log('[initUserMemory] 开始初始化用户记忆，userId:', user.id);

      // 尝试获取用户记忆
      const memoryData = await chatService.getUserMemory(user.id);
      console.log('[initUserMemory] getUserMemory 返回:', memoryData);

      if (memoryData && memoryData.memory) {
        // 成功获取到记忆数据
        console.log('[initUserMemory] 获取到用户记忆:', memoryData.memory.substring(0, 100) + '...');
        setUserMemory(memoryData.memory);
      } else {
        // 没有记忆数据或 memory 字段为空，直接设置为空字符串
        console.log('[initUserMemory] 用户记忆为空，设置为空字符串');
        setUserMemory('');
      }
    } catch (error) {
      console.error('[initUserMemory] 初始化用户记忆失败:', error);
      setUserMemory('');
    }
  }, [user?.id]);

  // 将对话记录转换为消息格式
  const processRecords = useCallback(async (records: chatService.ChatRecord[]): Promise<Message[]> => {
    const newMessages: Message[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const isUser = record.chat_from === 'user';
      const timestamp = isUser ? formatTimeHHmm(new Date(record.gmt_create)) : undefined;

      if (record.type === 'diary') {
        const diaryDetail = await chatService.getDiaryDetail(record.chat_context);
        if (!diaryDetail) {
          console.log(`日记 ${record.chat_context} 不存在或已被删除，跳过显示`);
          continue;
        }
        newMessages.push({
          id: record.id,
          type: isUser ? 'user' : 'system',
          text: '',
          timestamp,
          recordType: 'diary',
          diaryData: {
            id: diaryDetail.id,
            context: diaryDetail.context,
            pic: diaryDetail.pic,
            gmt_create: record.gmt_create,
          },
        });
      } else if (record.type === 'image') {
        const imageUrl = record.chat_context.startsWith('http')
          ? record.chat_context
          : `${apiUrl}${record.chat_context}`;
        newMessages.push({
          id: record.id,
          type: isUser ? 'user' : 'system',
          text: '',
          imageUrl: imageUrl,
          timestamp,
          recordType: 'image',
        });
      } else if (record.type === 'emoji') {
        newMessages.push({
          id: record.id,
          type: isUser ? 'user' : 'system',
          text: `我今天的心情是${record.chat_context}`,
          timestamp,
          recordType: 'emoji',
        });
        setAssistantEmoji(record.chat_context);
      } else {
        const message: Message = {
          id: record.id,
          type: isUser ? 'user' : 'system',
          text: record.chat_context,
          timestamp,
          recordType: record.type,
        };
        if (message.type === 'system' &&
          message.text.includes('日记生成完成') &&
          message.text.includes('计划')) {
          message.plansProcessed = true;
        }
        newMessages.push(message);
      }
    }

    return newMessages;
  }, []);

  // 加载历史对话记录（使用新的游标分页接口）
  const loadChatHistory = useCallback(async () => {
    if (!user?.id || hasLoadedHistoryRef.current) {
      return;
    }

    try {
      setIsLoadingHistory(true);
      hasLoadedHistoryRef.current = true;

      // 先清除 assistantHistory
      await clearAssistantHistory();
      setAssistantHistory([]);

      // 使用新的游标分页接口获取最近的对话记录
      const result = await chatService.getRecentChatRecords(user.id, 30);
      const records = result.list;

      // 保存分页状态
      hasMoreHistoryRef.current = result.hasMore;
      nextBeforeIdRef.current = result.nextBeforeId;
      setHasMoreHistory(result.hasMore);

      // 转换记录为消息格式
      const newMessages = await processRecords(records);

      // 构建 assistantHistory（只取最新一次 diary 之后的记录）
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();

      let lastDiaryIndex = -1;
      for (let i = records.length - 1; i >= 0; i--) {
        const recordTime = new Date(records[i].gmt_create).getTime();
        if (recordTime >= todayStart && records[i].type === 'diary') {
          lastDiaryIndex = i;
          break;
        }
      }

      const historyItems: AssistantHistoryItem[] = [];
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const recordTime = new Date(record.gmt_create).getTime();
        const isToday = recordTime >= todayStart;

        if (isToday && i > lastDiaryIndex) {
          if (record.chat_from === 'user') {
            const content = record.type === 'image' ? '[图片]' : record.chat_context;
            historyItems.push({ role: 'user', content });
          } else {
            historyItems.push({ role: 'assistant', content: record.chat_context });
          }
        }
      }

      if (historyItems.length > 0) {
        setAssistantHistory(historyItems);
        saveAssistantHistory(historyItems);
      }

      setMessages(newMessages);

      // 冷启动加载完成后，无动画直接定位到底部，多次尝试确保内容已渲染
      setTimeout(() => { scrollToBottom(false); }, 100);
      setTimeout(() => { scrollToBottom(false); }, 300);
      setTimeout(() => { scrollToBottom(false); }, 600);
    } catch (error: any) {
      console.error('加载历史记录失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, messages.length, scrollToBottom, processRecords]);

  // 加载更早的历史记录
  const loadMoreHistory = useCallback(async () => {
    if (!user?.id || !hasMoreHistoryRef.current || !nextBeforeIdRef.current || isLoadingMoreRef.current) {
      return;
    }

    try {
      isLoadingMoreRef.current = true;
      setIsLoadingMore(true);

      const result = await chatService.getRecentChatRecords(user.id, 30, nextBeforeIdRef.current);

      // 更新分页状态
      hasMoreHistoryRef.current = result.hasMore;
      nextBeforeIdRef.current = result.nextBeforeId;
      setHasMoreHistory(result.hasMore);

      // 转换记录为消息格式
      const olderMessages = await processRecords(result.list);

      // prepend 到消息列表头部
      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      }
    } catch (error: any) {
      console.error('加载更多历史记录失败:', error);
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [user?.id, processRecords]);

  // 生成日记
  const generateDiary = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    // 检查今日生成日记次数限制
    const limitCheck = await checkUsageLimit(user.id, 'diary');
    if (!limitCheck.allowed) {
      Alert.alert('提示', limitCheck.message || '您已超过当日的体验次数');
      return;
    }

    // 打点：点击生成日记按钮
    logByPosition('GENERATE_DIARY_BUTTON', user.id);

    try {
      // 保存当前图片列表的副本，避免在生成过程中被清空
      const currentImageList = [...imageList];
      console.log('开始生成日记，当前imageList:', imageList, '保存的副本:', currentImageList);
      // 保存图片列表快照，用于在生成过程中显示
      setDiaryImageList(currentImageList);
      setIsGeneratingDiary(true);
      setShowDiaryModal(true);
      setDiaryContent('');
      setDiaryImageUrl(undefined);

      // 获取当前 history
      const history = await getAssistantHistory();
      
      // 立即异步调用抽取记忆接口（不等待结果，不阻塞日记生成）
      console.log('[生成日记] 立即启动异步抽取记忆');
      const finalHistory = [...history];
      if (userMemory && userMemory.length > 0) {
        finalHistory.unshift({ role: 'assistant', content: userMemory });
      }
      
      // 异步抽取记忆（完全不阻塞日记生成流程）
      chatService.extractUserMemory(finalHistory, user.id).then((extractedMemory) => {
        if (extractedMemory) {
          console.log('[生成日记] 抽取记忆成功:', extractedMemory);
          const memoryContent = JSON.stringify(extractedMemory);
          
          // 更新用户记忆到数据库
          chatService.updateUserMemory(user.id, memoryContent).then((success) => {
            if (success) {
              console.log('[生成日记] 更新用户记忆成功');
              // 同时更新本地的 userMemory 状态
              setUserMemory(memoryContent);
            } else {
              console.error('[生成日记] 更新用户记忆失败');
            }
          }).catch((error) => {
            console.error('[生成日记] 更新用户记忆异常:', error);
          });
        } else {
          console.log('[生成日记] 抽取记忆失败或无新记忆');
        }
      }).catch((error) => {
        console.error('[生成日记] 抽取记忆异常:', error);
      });

      // 收集用户消息内容（从 assistantHistory 中提取 role === 'user' 的消息）
      const userContent: string[] = assistantHistory
        .filter((item) => item.role === 'user')
        .map((item) => item.content);

      // 找到最后一次生成日记的位置（从后往前找最后一个 recordType === 'diary' 的消息）
      let lastDiaryIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].recordType === 'diary') {
          lastDiaryIndex = i;
          break;
        }
      }

      // 从最后一次生成日记之后的消息中提取图片 URL（查找最后一张图片）
      const messagesAfterLastDiary = lastDiaryIndex >= 0
        ? messages.slice(lastDiaryIndex + 1)
        : messages;

      const imageMessages = messagesAfterLastDiary.filter(msg => msg.imageUrl);
      let currentImageUrl: string | undefined = undefined;
      if (imageMessages.length > 0) {
        const lastImage = imageMessages[imageMessages.length - 1];
        currentImageUrl = lastImage.imageUrl;
        setDiaryImageUrl(currentImageUrl);
      }

      // 开始生成日记（使用当前 history，不等待抽取记忆）
      console.log('[生成日记] 开始生成日记内容');
      
      // 调用生成日记接口（流式）
      const fullContent = await chatService.generateDiary(
        userContent,
        history, // 直接使用当前 history
        user.id,
        (text: string) => {
          // 流式更新内容
          setDiaryContent(text);
        }
      );

      // 打点：日记生成完成
      logByPosition('DIARY_GENERATE_COMPLETE', user.id);

      // 生成完成后，保存日记
      try {
        // 将图片列表转为路径数组，然后转为JSON字符串（使用保存的副本）
        const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
        console.log('[生成日记] 保存日记时使用的图片列表 currentImageList:', currentImageList);
        const picPaths = currentImageList.map((imageUrl) => {
          if (imageUrl.startsWith(apiUrl)) {
            // 去掉域名前缀，只保留路径
            return imageUrl.replace(apiUrl, '');
          } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // 如果已经是完整URL，提取路径部分
            try {
              const url = new URL(imageUrl);
              return url.pathname;
            } catch {
              // 如果解析失败，尝试手动提取路径（如 /api/upload/files/xxx.jpg）
              const match = imageUrl.match(/\/api\/upload\/[^\s?]+/);
              return match ? match[0] : '';
            }
          } else {
            // 如果已经是路径格式（如 /api/upload/files/xxx.jpg），直接使用
            return imageUrl;
          }
        }).filter(path => path); // 过滤掉空路径

        console.log('[生成日记] 处理后的图片路径数组 picPaths:', picPaths);
        
        // 将图片路径数组转为JSON字符串
        const picJson = picPaths.length > 0 ? JSON.stringify(picPaths) : '';
        
        console.log('[生成日记] 最终的 picJson:', picJson);
        console.log('[生成日记] picJson 长度:', picJson.length);

        // 获取用户当前位置和天气信息
        const { city, weather } = await getLocationAndWeather();

        // 保存日记并获取返回的ID
        console.log("assistantEmoji:"+ assistantEmoji);
        const diaryId = await chatService.saveDiary(fullContent, user.id, picJson, assistantEmoji, undefined, city, weather);
        setCurrentDiaryId(diaryId); // 保存当前生成的日记ID

        // 清空图片列表（日记生成后清空）
        setImageList([]);

        // 保存对话记录：用户生成日记，使用保存后返回的日记ID
        chatService.saveChatRecord(user.id, 'diary', 'user', diaryId).catch(() => {
          // 静默处理错误
        });

        // 在对话框内添加日记卡片
        // 使用图片列表（JSON格式）
        const diaryMessage: Message = {
          id: `diary_${Date.now()}`,
          type: 'user',
          text: '',
          recordType: 'diary',
          diaryData: {
            id: diaryId,
            context: fullContent,
            pic: picJson, // 使用JSON格式的图片列表
            gmt_create: new Date().toISOString(), // 使用当前时间
          },
        };
        setMessages((prev) => [...prev, diaryMessage]);

        // 滚动到底部
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // 生成日记后，调用生成计划接口
        try {
          const planHistory = await getAssistantHistory();
          const planData = await chatService.generatePlan(planHistory, user.id);

          // 如果返回的plans长度>0,添加系统消息
          if (planData.plans && planData.plans.length > 0) {
            const systemMessageText = '日记生成完成，我发现日记中几处需要你未来去做的计划，需要我帮你加入计划列表吗？';
            const planSystemMessage: Message = {
              id: `plan_${Date.now()}`,
              type: 'system',
              text: systemMessageText,
              plans: planData,
            };
            setMessages((prev) => [...prev, planSystemMessage]);

            // 添加到历史记录（但不保存到chats表）
            setAssistantHistory((prev) => {
              const newHistory = [...prev, { role: 'assistant' as const, content: systemMessageText }];
              saveAssistantHistory(newHistory);
              return newHistory;
            });

            // 滚动到底部
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          }
        } catch (planError: any) {
          // 静默处理生成计划失败，不影响日记生成流程
          console.error('生成计划失败:', planError);
        }

        // 保存日记成功后，清空 assistantHistory，确保接下来的对话和生成日记不受之前的影响
        await clearAssistantHistory();
        setAssistantHistory([]);

        // 流式展示完成后，Toast 提示会在 DiaryGenerateModal 中显示
      } catch (saveError: any) {
        console.error('保存日记失败:', saveError);
        Alert.alert('提示', '日记生成成功，但保存失败：' + (saveError.message || '请稍后重试'));
      }
    } catch (error: any) {
      console.error('生成日记失败:', error);
      Alert.alert('错误', error.message || '生成日记失败，请重试');
      setShowDiaryModal(false);
    } finally {
      setIsGeneratingDiary(false);
    }
  }, [user?.id, assistantHistory, messages, imageList, assistantEmoji, userMemory, setUserMemory, scrollToBottom, currentDiaryId]);

  // 刷新聊天历史（用于删除日记后刷新列表）
  const refreshChatHistory = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    try {
      // 重置加载标记，允许重新加载
      hasLoadedHistoryRef.current = false;
      
      // 重新加载历史记录
      await loadChatHistory();
    } catch (error: any) {
      console.error('刷新历史记录失败:', error);
    }
  }, [user?.id, loadChatHistory]);

  return {
    messages,
    setMessages,
    assistantHistory,
    setAssistantHistory,
    assistantEmoji,
    setAssistantEmoji,
    isSending,
    isGeneratingDiary,
    isLoadingHistory,
    isLoadingMore,
    hasMoreHistory,
    showDiaryModal,
    diaryContent,
    diaryImageUrl,
    currentDiaryId,
    imageList, // 图片列表
    diaryImageList, // 生成日记时的图片列表快照
    userMemory, // 用户长期记忆
    setShowDiaryModal,
    sendMessage,
    uploadImageAndUnderstand,
    generateDiary,
    loadPendingMessages,
    loadChatHistory,
    loadMoreHistory,
    initUserMemory, // 初始化用户记忆
    refreshChatHistory,
    scrollToBottom,
  };
};

