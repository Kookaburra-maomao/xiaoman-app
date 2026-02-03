/**
 * 对话相关业务逻辑Hook
 */

import { useAuth } from '@/contexts/AuthContext';
import { useTypewriter } from '@/hooks/useTypewriter';
import * as chatService from '@/services/chatService';
import * as imageService from '@/services/imageService';
import { Message } from '@/types/chat';
import { clearAssistantHistory, clearPendingConversations, clearPendingMessages, clearUnreadCount, getAssistantHistory, getPendingConversations, getPendingMessages, saveAssistantHistory } from '@/utils/unread-messages';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export const useChat = (scrollViewRef?: RefObject<any>) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantHistory, setAssistantHistory] = useState<string[]>([]);
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
  const hasLoadedHistoryRef = useRef(false); // 标记是否已加载过历史记录
  const currentSystemMessageRef = useRef<string>('');

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
  const scrollToBottom = useCallback(() => {
    if (scrollViewRef?.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
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
              { id: userMessageId, type: 'user', text: '', imageUrl: conversation.userImageUrl },
            ]);
            setAssistantHistory((prev) => {
              const newHistory = [...prev, `user:[图片]`];
              saveAssistantHistory(newHistory);
              return newHistory;
            });
          } else if (conversation.userMessage) {
            // 文本消息
            setMessages((prev) => [
              ...prev,
              { id: userMessageId, type: 'user', text: conversation.userMessage },
            ]);
            setAssistantHistory((prev) => {
              const newHistory = [...prev, `user:${conversation.userMessage}`];
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
              const newHistory = [...prev, `system:${conversation.systemMessage}`];
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
            const newHistory = [...prev, `system:${messageText}`];
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
    if (!userContent.trim() || isSending || !user?.id) {
      return;
    }

    const userMessageId = Date.now().toString();

    // 添加用户消息到界面
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, type: 'user', text: userContent },
    ]);

    // 添加到历史记录
    setAssistantHistory((prev) => {
      const newHistory = [...prev, `user:${userContent}`];
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

    try {
      const history = await getAssistantHistory();
      const fullText = await chatService.sendChatMessage(userContent, user.id, history);

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
        const newHistory = [...prev, `system:${fullText}`];
        saveAssistantHistory(newHistory);
        return newHistory;
      });

      // 保存对话记录：系统回复
      chatService.saveChatRecord(user.id, 'chat', 'system', fullText).catch(() => {
        // 静默处理错误
      });
    } catch (error: any) {
      console.error('发送消息失败:', error);
      Alert.alert('错误', error.message || '发送消息失败，请重试');

      // 移除失败的系统消息
      setMessages((prev) => prev.filter((msg) => msg.id !== systemMessageId));
    } finally {
      setIsSending(false);
    }
  }, [isSending, user?.id, stopTypewriter, startTypewriter, updateTypewriterTarget, waitForTypewriter]);

  // 上传图片并调用图片理解
  const uploadImageAndUnderstand = useCallback(async (imageUri: string, scrollToBottomFn?: () => void) => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

    try {
      setIsSending(true);

      // 上传图片
      const uploadResult = await imageService.uploadImage(imageUri);
      const imageUrl = `${uploadResult.url}`;

      // 将图片添加到列表（最多3张，FIFO）
      setImageList((prev) => {
        const newList = [...prev, imageUrl];
        // 如果超过3张，移除最旧的
        const result = newList.slice(-3);
        console.log('添加图片到列表:', { imageUrl, prev, result });
        return result;
      });

      // 在右侧显示图片消息（用户消息）
      const imageMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        text: '',
        imageUrl: imageUrl,
      };

      setMessages((prev) => [...prev, imageMessage]);
      if (scrollToBottomFn) scrollToBottomFn();

      // 添加到历史记录
      setAssistantHistory((prev) => {
        const newHistory = [...prev, `user:[图片]`];
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
              const newHistory = [...prev, `system:${content}`];
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
      console.error('上传图片或理解失败:', error);
      Alert.alert('错误', error.message || '图片上传或理解失败，请重试');

      // 移除失败的消息
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith('vl_')));
      stopTypewriter();
    } finally {
      setIsSending(false);
    }
  }, [user?.id, stopTypewriter, startTypewriter, updateTypewriterTarget, waitForTypewriter]);

  // 加载历史对话记录
  const loadChatHistory = useCallback(async () => {
    if (!user?.id || hasLoadedHistoryRef.current) {
      // 如果已加载过，不再加载
      return;
    }

    try {
      setIsLoadingHistory(true);
      hasLoadedHistoryRef.current = true;

      // 先清除 assistantHistory
      await clearAssistantHistory();
      setAssistantHistory([]);

      // 计算时间范围：昨天的 00:00:00 到当前时间
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const startTime = yesterday.toISOString();
      const endTime = now.toISOString();

      // 获取对话记录
      const records = await chatService.getChatRecords(user.id, startTime, endTime);

      // 转换记录为消息格式
      const newMessages: Message[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.getTime();

      // 找到当天最新一次 type=diary 的记录位置（不包含这条记录）
      let lastDiaryIndex = -1;
      for (let i = records.length - 1; i >= 0; i--) {
        const recordTime = new Date(records[i].gmt_create).getTime();
        if (recordTime >= todayStart && records[i].type === 'diary') {
          lastDiaryIndex = i;
          break;
        }
      }

      // 收集需要添加到 assistantHistory 的记录
      const historyItems: string[] = [];

      // 处理每条记录
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const recordTime = new Date(record.gmt_create).getTime();
        const isToday = recordTime >= todayStart;

        if (record.type === 'diary') {
          // 日记类型，需要获取详情
          try {
            const diaryDetail = await chatService.getDiaryDetail(record.chat_context);
            const message: Message = {
              id: record.id,
              type: record.chat_from === 'user' ? 'user' : 'system',
              text: '',
              recordType: 'diary',
              diaryData: {
                id: diaryDetail.id,
                context: diaryDetail.context,
                pic: diaryDetail.pic,
                gmt_create: record.gmt_create,
              },
            };
            newMessages.push(message);
          } catch (error) {
            console.error('获取日记详情失败:', error);
            // 如果获取失败，跳过这条记录
          }
        } else if (record.type === 'image') {
          // 图片类型
          const imageUrl = record.chat_context.startsWith('http')
            ? record.chat_context
            : `${apiUrl}${record.chat_context}`;
          const message: Message = {
            id: record.id,
            type: record.chat_from === 'user' ? 'user' : 'system',
            text: '',
            imageUrl: imageUrl,
            recordType: 'image',
          };
          newMessages.push(message);
        } else if (record.type === 'emoji') {
          // emoji类型
          const message: Message = {
            id: record.id,
            type: record.chat_from === 'user' ? 'user' : 'system',
            text: `我今天的心情是${record.chat_context}`,
            recordType: 'emoji',
          };
          newMessages.push(message);
          // 更新assistantEmoji的值
          setAssistantEmoji(record.chat_context);
        } else {
          // 文字类型（chat 或 text）
          const message: Message = {
            id: record.id,
            type: record.chat_from === 'user' ? 'user' : 'system',
            text: record.chat_context,
            recordType: record.type,
          };

          // 如果是包含计划提示的系统消息，标记为已处理（因为计划数据不会从数据库恢复）
          // 如果用户已经看到过这个消息，说明计划可能已经被处理过，或者用户已经选择不添加计划
          if (message.type === 'system' &&
            message.text.includes('日记生成完成') &&
            message.text.includes('计划')) {
            message.plansProcessed = true;
          }

          newMessages.push(message);
        }

        // 如果是当天的记录，且在最新一次 diary 之后（不包含 diary），添加到 historyItems
        if (isToday && i > lastDiaryIndex) {
          if (record.chat_from === 'user') {
            const prefix = record.type === 'image' ? 'user:[图片]' : `user:${record.chat_context}`;
            historyItems.push(prefix);
          } else {
            historyItems.push(`system:${record.chat_context}`);
          }
        }
      }

      // 统一设置 assistantHistory
      if (historyItems.length > 0) {
        setAssistantHistory(historyItems);
        saveAssistantHistory(historyItems);
      }

      setMessages(newMessages);

      // 滚动到底部
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    } catch (error: any) {
      console.error('加载历史记录失败:', error);
      // 静默处理错误，不显示提示
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, messages.length, scrollToBottom]);

  // 生成日记
  const generateDiary = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return;
    }

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

      // 收集用户消息内容（从 assistantHistory 中提取 user: 开头的消息）
      const userContent: string[] = assistantHistory
        .filter((item) => item.startsWith('user:'))
        .map((item) => item.replace(/^user:/, ''));

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

      // 调用生成日记接口（流式）
      const history = await getAssistantHistory();
      const fullContent = await chatService.generateDiary(
        userContent,
        history,
        user.id,
        (text: string) => {
          // 流式更新内容
          setDiaryContent(text);
        }
      );

      // 生成完成后，保存日记
      try {
        // 将图片列表转为路径数组，然后转为JSON字符串（使用保存的副本）
        const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
        console.log('保存日记时使用的图片列表:', currentImageList);
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

        // 将图片路径数组转为JSON字符串
        const picJson = picPaths.length > 0 ? JSON.stringify(picPaths) : '';

        // 保存日记并获取返回的ID
        const diaryId = await chatService.saveDiary(fullContent, user.id, picJson, assistantEmoji);
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
              const newHistory = [...prev, `system:${systemMessageText}`];
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

        // 流式展示完成后，显示保存成功提示
        // 使用setTimeout确保在isGeneratingDiary设置为false之后显示
        setTimeout(() => {
          Alert.alert('成功', '日记已保存在记录中');
        }, 100);
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
  }, [user?.id, assistantHistory, messages, imageList, assistantEmoji, scrollToBottom, currentDiaryId]);

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
    showDiaryModal,
    diaryContent,
    diaryImageUrl,
    currentDiaryId,
    imageList, // 图片列表
    diaryImageList, // 生成日记时的图片列表快照
    setShowDiaryModal,
    sendMessage,
    uploadImageAndUnderstand,
    generateDiary,
    loadPendingMessages,
    loadChatHistory,
    scrollToBottom,
  };
};

