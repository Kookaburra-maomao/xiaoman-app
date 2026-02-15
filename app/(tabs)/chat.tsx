import ChatHeader from '@/components/chat/ChatHeader';
import ChatInput from '@/components/chat/ChatInput';
import DiaryGenerateModal from '@/components/chat/DiaryGenerateModal';
import MessageList from '@/components/chat/MessageList';
import OperationCardCarousel from '@/components/chat/OperationCard';
import PlanAddModal from '@/components/chat/PlanAddModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useOperationCard } from '@/hooks/useOperationCard';
import { useRecording } from '@/hooks/useRecording';
import * as chatService from '@/services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams(); // 获取路由参数
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [cardStateBeforeKeyboard, setCardStateBeforeKeyboard] = useState(true); // 记录键盘弹出前的卡片状态
  // 移除 MenuModal，改为跳转到设置页面
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlanMessage, setSelectedPlanMessage] = useState<{ id: string; plans: any } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // 获取安全区域边距，用于计算header高度
  const insets = useSafeAreaInsets();
  const headerHeight = insets.top + 16 + 24 + 14 + 20; // top inset + paddingTop + title height + date height + paddingBottom

  // 使用运营卡片 Hook
  const {
    showCard,
    operationCards,
    cardSlideAnim,
    cardTranslateY,
    setShowCard,
    fetchOperationCards,
    checkShouldShowCard,
  } = useOperationCard({ autoCheck: true });

  const {
    messages,
    setMessages,
    isSending,
    isGeneratingDiary,
    showDiaryModal,
    diaryContent,
    diaryImageUrl,
    currentDiaryId,
    diaryImageList,
    setShowDiaryModal,
    sendMessage,
    uploadImageAndUnderstand,
    generateDiary,
    loadPendingMessages,
    loadChatHistory,
    refreshChatHistory,
    scrollToBottom,
    setAssistantEmoji,
  } = useChat(scrollViewRef);

  const {
    isRecording,
    recordingDuration,
    audioLevel,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAndRecognize,
  } = useRecording();

  // 监听键盘显示/隐藏事件
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // 键盘弹出时，保存当前卡片状态并隐藏卡片
        setCardStateBeforeKeyboard(showCard);
        if (showCard) {
          setShowCard(false);
        }
      }
    );

    // const keyboardWillHideListener = Keyboard.addListener(
    //   Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    //   () => {
    //     // 键盘收起时，恢复之前的卡片状态
    //     setShowCard(cardStateBeforeKeyboard);
    //   }
    // );

    // return () => {
    //   keyboardWillShowListener.remove();
    //   keyboardWillHideListener.remove();
    // };
  }, [showCard, cardStateBeforeKeyboard]);

  // 监听页面聚焦，加载历史记录和待发送的消息
  useFocusEffect(
    useCallback(() => {
      // 检查是否需要刷新（从日记详情页返回）
      const checkRefreshNeeded = async () => {
        try {
          const needsRefresh = await AsyncStorage.getItem('@chat_needs_refresh');
          if (needsRefresh === 'true') {
            // 清除标记
            await AsyncStorage.removeItem('@chat_needs_refresh');
            // 刷新聊天历史
            await refreshChatHistory();
          } else {
            // 正常加载历史记录
            loadChatHistory();
          }
        } catch (error) {
          console.error('检查刷新状态失败:', error);
          // 出错时正常加载
          loadChatHistory();
        }
      };
      
      checkRefreshNeeded();
      // 然后加载待发送的消息
      loadPendingMessages();
      // 加载运营卡片
      fetchOperationCards();
      // 检查是否应该展示运营卡片
      checkShouldShowCard();
    }, [loadChatHistory, refreshChatHistory, loadPendingMessages, fetchOperationCards, checkShouldShowCard])
  );

  // 处理从 record 页面跳转过来的运营卡片参数
  useEffect(() => {
    if (params.operationPromptRule && params.operationText && params.operationEmoji) {
      // 展示运营卡片
      setShowCard(true);
      
      // 延迟执行运营卡片选项选择逻辑，确保页面已加载
      setTimeout(() => {
        handleOperationItemSelect(
          params.operationPromptRule as string,
          params.operationText as string,
          params.operationEmoji as string
        );
        
        // 清除路由参数（通过替换当前路由）
        router.replace('/(tabs)/chat');
      }, 300);
    }
  }, [params.operationPromptRule, params.operationText, params.operationEmoji]);

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
          const trimmedText = recognizedText.trim();
          // 保存对话记录：用户上传录音
          if (user?.id) {
            chatService.saveChatRecord(user.id, 'text', 'user', trimmedText).catch(() => {
              // 静默处理错误
            });
          }
          setShowCard(false);
          await sendMessage(trimmedText, scrollToBottom);
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

  // 处理语音按钮点击（保留用于兼容）
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

  // 处理按住开始录音
  const handleVoiceButtonPressIn = useCallback(async () => {
    console.log('handleVoiceButtonPressIn called', { isGeneratingDiary, isRecording });
    if (isGeneratingDiary) {
      console.log('Skipping: isGeneratingDiary');
      return;
    }
    if (!isRecording) {
      console.log('Starting recording...');
      const result = await startRecording();
      console.log('startRecording result:', result);
    } else {
      console.log('Already recording');
    }
  }, [isGeneratingDiary, isRecording, startRecording]);

  // 处理松手（发送或取消录音）
  const handleVoiceButtonPressOut = useCallback(async (shouldCancel: boolean) => {
    if (isGeneratingDiary || !isRecording) {
      return;
    }
    if (shouldCancel) {
      // 取消录音：只停止录音，不上传和发送
      await cancelRecording();
    } else {
      // 发送录音：停止录音并上传识别
      await handleStopRecording();
    }
  }, [isGeneratingDiary, isRecording, cancelRecording, handleStopRecording]);

  // 处理手势移动（上滑检测）
  const handleVoiceButtonMove = useCallback(() => {
    // 这个回调主要用于UI状态更新，实际逻辑在ChatInput中处理
    // 可以在这里添加额外的逻辑，比如震动反馈等
  }, []);

  // 打开图片选择器（摄像头或相册）
  const openImagePicker = useCallback(async () => {
    if (isGeneratingDiary || isUploadingImage) {
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
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setShowCard(false);
              setIsUploadingImage(true);
              try {
                await uploadImageAndUnderstand(result.assets[0].uri, scrollToBottom);
              } finally {
                setIsUploadingImage(false);
              }
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
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setShowCard(false);
              setIsUploadingImage(true);
              try {
                await uploadImageAndUnderstand(result.assets[0].uri, scrollToBottom);
              } finally {
                setIsUploadingImage(false);
              }
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [isGeneratingDiary, isUploadingImage, uploadImageAndUnderstand, scrollToBottom]);

  // 处理运营卡片选项选择
  const handleOperationItemSelect = useCallback((promptRule: string, text: string, emoji: string) => {
    // 更新assistantEmoji状态 - 保存text参数
    if (emoji) {
      setAssistantEmoji(emoji);
    }
    
    // 保存聊天记录：type=emoji, chat_from=user, chat_context=emoji内容
    if (user?.id && emoji) {
      chatService.saveChatRecord(user.id, 'emoji', 'user', text).catch(() => {
        // 静默处理错误
      });
    }
    
    // 发送消息：${promptRule} : ${text}
    const message = `${promptRule} : ${text}`;
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

  // 处理计划创建成功（用于刷新计划tab的数据）
  const handlePlanCreated = useCallback(() => {
    // 通过导航事件通知计划tab刷新数据
    // 使用 router 的 emit 方法或者直接触发刷新
    // 由于 tab 之间没有直接的导航关系，我们使用 useFocusEffect 在 plan.tsx 中处理
    // 这里可以添加其他逻辑，比如显示提示等
  }, []);

  // 处理计划添加完成
  const handlePlanAdded = useCallback((planIndex: number) => {
    if (selectedPlanMessage && selectedPlanMessage.plans) {
      const newPlans = selectedPlanMessage.plans.plans.filter((_: any, index: number) => index !== planIndex);
      if (newPlans.length === 0) {
        // 如果所有计划都已添加，关闭弹窗并标记消息为已处理
        setShowPlanModal(false);
        setSelectedPlanMessage(null);
        // 标记消息为已处理，保留计划数据用于历史记录
        setMessages((prev: any[]) =>
          prev.map((msg: any) => {
            if (msg.id === selectedPlanMessage.id) {
              return {
                ...msg,
                plansProcessed: true, // 标记为已处理
              };
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
    let messageToSend = inputText;
    
    // 检查字数限制
    if (inputText.length > 1000) {
      // 截取前1000个字
      messageToSend = inputText.substring(0, 1000);
      // 显示提示
      Alert.alert('提示', '最多输入1000字');
      // 更新输入框内容为截取后的内容
      setInputText(messageToSend);
    }
    
    setShowCard(false);
    sendMessage(messageToSend, scrollToBottom);
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
  const handleScroll = useCallback(() => {
    // 只要发生滚动事件，就隐藏运营卡片
    if (showCard) {
      setShowCard(false);
    }
  }, [showCard]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
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
          isStreaming={isSending}
        />

        {/* 悬浮的运营卡片 */}
        {operationCards.length > 0 && (
          <Animated.View
            style={[
              styles.cardWrapper,
              {
                top: headerHeight - 60, // 上移 60px
                opacity: cardSlideAnim, // 透明度实现渐显/渐隐效果
                transform: [{ translateY: cardTranslateY }], // 垂直位移实现下拉/上拉效果
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
          contentContainerStyle={[styles.scrollViewContent, { paddingTop: headerHeight }]}
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
          audioLevel={audioLevel}
          isSending={isSending}
          isGeneratingDiary={isGeneratingDiary}
          onInputChange={setInputText}
          onToggleInputMode={toggleInputMode}
          onVoiceButtonPress={handleVoiceButtonPress}
          onVoiceButtonPressIn={handleVoiceButtonPressIn}
          onVoiceButtonPressOut={handleVoiceButtonPressOut}
          onVoiceButtonMove={handleVoiceButtonMove}
          onSend={handleSendMessage}
          onImagePicker={openImagePicker}
          onInputFocus={() => setShowCard(false)}
        />
      </KeyboardAvoidingView>


      {/* 日记生成弹窗 */}
      <DiaryGenerateModal
        visible={showDiaryModal}
        content={diaryContent}
        imageUrl={diaryImageUrl}
        imageUrls={diaryImageList}
        isGenerating={isGeneratingDiary}
        gmt_create={new Date().toISOString()}
        diaryId={currentDiaryId || undefined}
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
          onPlanCreated={handlePlanCreated}
        />
      )}

      {/* 图片上传 Loading */}
      {isUploadingImage && (
        <View style={styles.uploadingOverlay}>
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.uploadingText}>正在上传图片...</Text>
          </View>
        </View>
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
    // paddingTop is set dynamically based on header height
  },
  cardWrapper: {
    position: 'absolute',
    // top is set dynamically based on header height
    left: 0,
    right: 0,
    zIndex: 998, // 低于header的zIndex（1000），确保不覆盖title区域
    overflow: 'hidden', // 裁剪超出部分，确保卡片收起时不会透出到title区域上方
  },
  uploadingOverlay: {
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
  uploadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
});
