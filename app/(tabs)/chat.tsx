import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import DiaryGenerateModal from '@/components/chat/DiaryGenerateModal';
import MessageList from '@/components/chat/MessageList';
import OperationCardCarousel from '@/components/chat/OperationCard';
import PlanAddModal from '@/components/chat/PlanAddModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useRecording } from '@/hooks/useRecording';
import * as chatService from '@/services/chatService';
import { OperationCard, getOperationCards } from '@/services/chatService';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const cardSlideAnim = useRef(new Animated.Value(0)).current; // 卡片滑动动画值
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [showCard, setShowCard] = useState(true);
  // 移除 MenuModal，改为跳转到设置页面
  const [operationCards, setOperationCards] = useState<OperationCard[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanMessage, setSelectedPlanMessage] = useState<{ id: string; plans: any } | null>(null);

  const {
    messages,
    setMessages,
    isSending,
    isGeneratingDiary,
    isLoadingHistory,
    showDiaryModal,
    diaryContent,
    diaryImageUrl,
    setShowDiaryModal,
    sendMessage,
    uploadImageAndUnderstand,
    generateDiary,
    loadPendingMessages,
    loadChatHistory,
    scrollToBottom,
    setAssistantEmoji,
  } = useChat(scrollViewRef);

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    uploadAndRecognize,
  } = useRecording();

  // 获取运营卡片
  const fetchOperationCards = useCallback(async () => {
    try {
      const cards = await getOperationCards();
      setOperationCards(cards);
    } catch (error) {
      console.error('获取运营卡片失败:', error);
      setOperationCards([]);
    }
  }, []);

  // 监听页面聚焦，加载历史记录和待发送的消息
  useFocusEffect(
    useCallback(() => {
      // 先加载历史记录
      loadChatHistory();
      // 然后加载待发送的消息
      loadPendingMessages();
      // 加载运营卡片
      fetchOperationCards();
    }, [loadChatHistory, loadPendingMessages, fetchOperationCards])
  );

  // 运营卡片显示/隐藏动画（渐显/渐隐）
  useEffect(() => {
    if (showCard) {
      // 显示：渐显
      Animated.timing(cardSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // 隐藏：渐隐
      Animated.timing(cardSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showCard, cardSlideAnim]);

  // 切换语音/文字输入
  const toggleInputMode = useCallback(() => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      setInputText('');
    } else {
      // 切换到语音模式时，停止正在进行的录音
      if (isRecording) {
        handleStopRecording();
      }
    }
  }, [isVoiceMode, isRecording]);

  // 处理停止录音
  const handleStopRecording = useCallback(async () => {
    const uri = await stopRecording();
    if (uri) {
      try {
        const recognizedText = await uploadAndRecognize(uri);
        // 将识别结果自动发送
        if (recognizedText?.trim()) {
          // 保存对话记录：用户上传录音
          if (user?.id) {
            chatService.saveChatRecord(user.id, 'text', 'user', recognizedText).catch(() => {
              // 静默处理错误
            });
          }
          setShowCard(false);
          await sendMessage(recognizedText, scrollToBottom);
        }
      } catch (error: any) {
        console.error('上传或识别失败:', error);
        Alert.alert(
          '录音完成',
          `上传或识别失败: ${error.message || '请稍后重试'}`
        );
      }
    }
  }, [stopRecording, uploadAndRecognize, sendMessage, scrollToBottom, user?.id]);

  // 处理语音按钮点击
  const handleVoiceButtonPress = useCallback(() => {
    if (isGeneratingDiary) {
      return;
    }
    if (isRecording) {
      handleStopRecording();
    } else {
      startRecording();
    }
  }, [isGeneratingDiary, isRecording, startRecording, handleStopRecording]);

  // 打开图片选择器（摄像头或相册）
  const openImagePicker = useCallback(async () => {
    if (isGeneratingDiary) {
      return;
    }
    // 显示选择对话框
    Alert.alert(
      '选择图片',
      '请选择图片来源',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '拍照',
          onPress: async () => {
            // 请求摄像头权限
            const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus !== 'granted') {
              Alert.alert('提示', '需要摄像头权限');
              return;
            }

            // 打开摄像头
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setShowCard(false);
              await uploadImageAndUnderstand(result.assets[0].uri, scrollToBottom);
            }
          },
        },
        {
          text: '从相册选择',
          onPress: async () => {
            // 请求相册权限
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('提示', '需要相册权限');
              return;
            }

            // 打开相册
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setShowCard(false);
              await uploadImageAndUnderstand(result.assets[0].uri, scrollToBottom);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [isGeneratingDiary, uploadImageAndUnderstand, scrollToBottom]);

  // 处理运营卡片选项选择
  const handleOperationItemSelect = useCallback((promptRule: string, emoji: string) => {
    // 更新assistantEmoji状态
    if (emoji) {
      setAssistantEmoji(emoji);
    }
    
    // 保存聊天记录：type=emoji, chat_from=user, chat_context=emoji内容
    if (user?.id && emoji) {
      chatService.saveChatRecord(user.id, 'emoji', 'user', emoji).catch(() => {
        // 静默处理错误
      });
    }
    
    // 发送消息：${prompt_rule} : ${emoji}
    const message = `${promptRule} : ${emoji}`;
    setShowCard(false);
    // 跳过保存用户消息记录，因为已经保存了emoji记录
    sendMessage(message, scrollToBottom, true);
  }, [sendMessage, scrollToBottom, user?.id, setAssistantEmoji]);

  // 处理生成日记
  const handleGenerateDiary = useCallback(() => {
    generateDiary();
  }, [generateDiary]);

  // 处理添加到计划
  const handleAddToPlan = useCallback((message: any) => {
    if (message.plans && message.id) {
      setSelectedPlanMessage({
        id: message.id,
        plans: message.plans,
      });
      setShowPlanModal(true);
    }
  }, []);

  // 处理计划添加完成
  const handlePlanAdded = useCallback((planIndex: number) => {
    if (selectedPlanMessage && selectedPlanMessage.plans) {
      const newPlans = selectedPlanMessage.plans.plans.filter((_: any, index: number) => index !== planIndex);
      if (newPlans.length === 0) {
        // 如果所有计划都已添加，关闭弹窗并更新消息
        setShowPlanModal(false);
        setSelectedPlanMessage(null);
        // 从messages中移除该消息的计划数据
        setMessages((prev: any[]) =>
          prev.map((msg: any) => {
            if (msg.id === selectedPlanMessage.id) {
              const { plans, ...rest } = msg;
              return rest;
            }
            return msg;
          })
        );
      } else {
        // 更新消息中的计划列表
        const updatedPlanData = {
          ...selectedPlanMessage.plans,
          plans: newPlans,
        };
        setSelectedPlanMessage({
          ...selectedPlanMessage,
          plans: updatedPlanData,
        });
        // 同时更新messages中的计划数据
        setMessages((prev: any[]) =>
          prev.map((msg: any) => {
            if (msg.id === selectedPlanMessage.id) {
              return {
                ...msg,
                plans: updatedPlanData,
              };
            }
            return msg;
          })
        );
      }
    }
  }, [selectedPlanMessage, setMessages]);

  // 处理发送消息
  const handleSendMessage = useCallback(() => {
    setShowCard(false);
    sendMessage(inputText, scrollToBottom);
    setInputText('');
  }, [inputText, sendMessage, scrollToBottom]);

  // 处理退出登录
  const handleLogout = useCallback(() => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // 登出后，路由守卫会自动检测 isAuthenticated 变化并跳转到登录页
            } catch (error) {
              Alert.alert('错误', '退出登录失败，请重试');
            }
          },
        },
      ]
    );
  }, [logout]);

  // 处理滚动事件，当发生滚动时自动隐藏运营卡片
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // 只要发生滚动事件，就隐藏运营卡片
    if (showCard) {
      setShowCard(false);
    }
  }, [showCard]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar hidden />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* 固定在顶部的标题部分 */}
        <ChatHeader
          showCard={showCard}
          onToggleCard={() => setShowCard(!showCard)}
          onShowMenu={() => router.push('/settings' as any)}
        />

        {/* 悬浮的运营卡片 */}
        {operationCards.length > 0 && (
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                opacity: cardSlideAnim, // 只使用透明度实现渐显/渐隐效果
              },
            ]}
            pointerEvents={showCard ? 'auto' : 'none'} // 隐藏时禁用交互
          >
            <OperationCardCarousel
              cards={operationCards}
              username={user?.nick || user?.username || '用户'}
              onItemSelect={handleOperationItemSelect}
            />
          </Animated.View>
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* 消息列表 */}
          <MessageList
            messages={messages}
            isGeneratingDiary={isGeneratingDiary}
            onGenerateDiary={handleGenerateDiary}
            onAddToPlan={handleAddToPlan}
          />
        </ScrollView>

        {/* 底部输入区域 */}
        <ChatInput
          inputText={inputText}
          isVoiceMode={isVoiceMode}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          isSending={isSending}
          isGeneratingDiary={isGeneratingDiary}
          onInputChange={setInputText}
          onToggleInputMode={toggleInputMode}
          onVoiceButtonPress={handleVoiceButtonPress}
          onSend={handleSendMessage}
          onImagePicker={openImagePicker}
        />
      </KeyboardAvoidingView>


      {/* 日记生成弹窗 */}
      <DiaryGenerateModal
        visible={showDiaryModal}
        content={diaryContent}
        imageUrl={diaryImageUrl}
        isGenerating={isGeneratingDiary}
        onClose={() => {
          if (!isGeneratingDiary) {
            setShowDiaryModal(false);
          }
        }}
      />

      {/* 添加计划弹窗 */}
      {user?.id && (
        <PlanAddModal
          visible={showPlanModal}
          planData={selectedPlanMessage?.plans || null}
          userId={user.id}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedPlanMessage(null);
          }}
          onPlanAdded={handlePlanAdded}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 80, // 固定 paddingTop，确保消息不被 header 遮挡，不受运营卡片显示状态影响
  },
  cardWrapper: {
    position: 'absolute',
    top: 60, // header 高度约 40px（按钮位置）+ 20px（间距）= 60px
    left: 0,
    right: 0,
    zIndex: 999,
  },
});
