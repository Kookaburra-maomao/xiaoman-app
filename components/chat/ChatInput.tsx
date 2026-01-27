/**
 * 聊天输入组件
 */

import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Keyboard, Modal, PanResponder, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const RADIO_ICON_URL = 'http://39.103.63.159/api/files/xiaoman-chat-radio.png';
const KEYBOARD_ICON_URL = 'http://39.103.63.159/api/files/xiaoman-chat-keyboard.png';
const PIC_ICON_URL = 'http://39.103.63.159/api/files/xiaoman-chat-pic.png';
const SEND_MSG_ICON_URL = 'http://39.103.63.159/api/files/xiaoman-chat-sendmsg.png';

interface ChatInputProps {
  inputText: string;
  isVoiceMode: boolean;
  isRecording: boolean;
  recordingDuration: number;
  audioLevel?: number; // 音量级别 0-1
  isSending: boolean;
  isGeneratingDiary: boolean;
  onInputChange: (text: string) => void;
  onToggleInputMode: () => void;
  onVoiceButtonPress: () => void;
  onVoiceButtonPressIn: () => void;
  onVoiceButtonPressOut: (shouldCancel: boolean) => void;
  onVoiceButtonMove: (isMovingUp: boolean) => void;
  onSend: () => void;
  onImagePicker: () => void;
}

const DOT_COUNT = 30; // 点的数量
const DOT_SPACING = scaleSize(3); // 点之间的间距
const WAVE_HEIGHT = scaleSize(8); // 波形最大高度

// 单个动画点组件
interface AnimatedDotProps {
  dot: {
    y: SharedValue<number>;
    scale: SharedValue<number>;
    opacity: SharedValue<number>;
  };
  index: number;
  isMovingUp: boolean;
}

const AnimatedDot = ({ dot, index, isMovingUp }: AnimatedDotProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: dot.y.value },
        { scale: dot.scale.value },
      ],
      opacity: dot.opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.recordingDot,
        isMovingUp && styles.recordingDotCancel,
        animatedStyle,
      ]}
    />
  );
};

export default function ChatInput({
  inputText,
  isVoiceMode,
  isRecording,
  recordingDuration,
  audioLevel = 0,
  isSending,
  isGeneratingDiary,
  onInputChange,
  onToggleInputMode,
  onVoiceButtonPress,
  onVoiceButtonPressIn,
  onVoiceButtonPressOut,
  onVoiceButtonMove,
  onSend,
  onImagePicker,
}: ChatInputProps) {
  const [isMovingUp, setIsMovingUp] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const textInputRef = useRef<TextInput>(null);
  const shouldCancelRef = useRef<boolean>(false); // 用于保存是否应该取消的状态
  
  // 创建点阵动画值
  const dotPositions = useRef(
    Array(DOT_COUNT)
      .fill(0)
      .map(() => ({
        y: useSharedValue(0),
        scale: useSharedValue(1),
        opacity: useSharedValue(0.3),
      }))
  ).current;
  
  const volumeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // 监听键盘显示/隐藏
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
      // 延迟重置焦点状态，确保UI正确更新
      setTimeout(() => {
        setIsInputFocused(false);
      }, 100);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 根据音量更新点阵动画
  useEffect(() => {
    if (!isRecording) {
      // 停止录音时，重置所有点
      dotPositions.forEach((dot) => {
        dot.y.value = withSpring(0, { damping: 15, stiffness: 100 });
        dot.scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        dot.opacity.value = withTiming(0.3, { duration: 300 });
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // 更新音量引用
    volumeRef.current = audioLevel;

    // 动画循环函数
    const animate = () => {
      const volume = volumeRef.current;
      const time = Date.now() / 1000;

      dotPositions.forEach((dot, index) => {
        if (volume > 0.05 && !isMovingUp) {
          // 有声状态：生成波形
          // 创建多个正弦波叠加的效果，形成连续的声波线
          const wave1 = Math.sin(time * 2 + index * 0.3) * volume;
          const wave2 = Math.sin(time * 3.5 + index * 0.5) * volume * 0.7;
          const wave3 = Math.sin(time * 5 + index * 0.2) * volume * 0.3;
          const waveHeight = ((wave1 + wave2 + wave3) / 3) * WAVE_HEIGHT;

          // Y轴位置动画（弹簧效果）
          dot.y.value = withSpring(waveHeight, {
            damping: 12,
            stiffness: 100,
            mass: 0.8,
          });

          // 大小变化（音量越大点越大）
          const targetScale = 1 + volume * 0.5;
          dot.scale.value = withSpring(targetScale, {
            damping: 15,
            stiffness: 150,
          });

          // 透明度变化
          dot.opacity.value = withTiming(0.8 + volume * 0.2, {
            duration: 200,
            easing: Easing.out(Easing.ease),
          });
        } else {
          // 静音或取消状态：恢复原位
          // 添加延迟，创建涟漪效果
          const delay = index * 5;
          
          dot.y.value = withSpring(0, {
            damping: 20,
            stiffness: 120,
          });
          
          dot.scale.value = withSpring(1, {
            damping: 15,
            stiffness: 150,
          });
          
          dot.opacity.value = withTiming(isMovingUp ? 1 : 0.3, {
            duration: 300,
          });
        }
      });

      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRecording, audioLevel, isMovingUp]);

  // 判断是否显示扩展样式（键盘显示且是文字输入态）
  const showExpandedStyle = !isVoiceMode && isKeyboardVisible && isInputFocused;
  
  // 判断是否显示发送按钮
  // 1. 键盘显示时，始终显示发送按钮（在输入框内）
  // 2. 键盘收起时，如果有文字内容，显示发送按钮；否则隐藏
  const hasText = inputText.trim().length > 0;
  const showSendButton = showExpandedStyle || (!isKeyboardVisible && !isInputFocused && hasText);

  // 手势处理（用于检测上滑取消）- 在按钮和透明蒙层上工作
  // 使用 useMemo 确保 PanResponder 能够访问最新的状态
  const buttonPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          // 在语音模式且未录音时，按钮应该响应手势（用于开始录音）
          return isVoiceMode && !isGeneratingDiary && !isRecording;
        },
        onMoveShouldSetPanResponder: () => {
          // 一旦开始响应，就一直响应移动事件
          return isVoiceMode && !isGeneratingDiary;
        },
        onPanResponderGrant: (evt) => {
          if (isVoiceMode && !isGeneratingDiary && !isRecording) {
            // 记录初始触摸位置
            startYRef.current = evt.nativeEvent.pageY;
            currentYRef.current = evt.nativeEvent.pageY;
            shouldCancelRef.current = false;
            setIsMovingUp(false);
            // 开始录音
            onVoiceButtonPressIn();
          }
        },
        onPanResponderMove: (evt) => {
          if (isVoiceMode && !isGeneratingDiary) {
            // 更新当前触摸位置
            currentYRef.current = evt.nativeEvent.pageY;
            // 如果正在录音，计算上滑距离
            if (isRecording && startYRef.current > 0) {
              const deltaY = startYRef.current - currentYRef.current;
              const movingUp = deltaY > 50; // 向上移动超过50px认为是上滑
              shouldCancelRef.current = movingUp;
              
              setIsMovingUp((prevMovingUp) => {
                if (movingUp !== prevMovingUp) {
                  onVoiceButtonMove(movingUp);
                  return movingUp;
                }
                return prevMovingUp;
              });
            }
          }
        },
        onPanResponderRelease: () => {
          // 在按钮上释放时处理录音结束
          if (isRecording) {
            const shouldCancel = shouldCancelRef.current;
            onVoiceButtonPressOut(shouldCancel);
            // 重置状态
            setIsMovingUp(false);
            shouldCancelRef.current = false;
            startYRef.current = 0;
            currentYRef.current = 0;
          }
        },
        onPanResponderTerminate: () => {
          // 终止时也处理录音结束
          if (isRecording) {
            const shouldCancel = shouldCancelRef.current;
            onVoiceButtonPressOut(shouldCancel);
            // 重置状态
            setIsMovingUp(false);
            shouldCancelRef.current = false;
            startYRef.current = 0;
            currentYRef.current = 0;
          }
        },
      }),
    [isVoiceMode, isGeneratingDiary, isRecording, onVoiceButtonPressIn, onVoiceButtonMove, onVoiceButtonPressOut]
  );

  // 手势处理（用于检测上滑取消）- 在透明蒙层上工作
  // 使用 useMemo 确保 PanResponder 能够访问最新的状态
  const overlayPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => {
          // 在录音时，蒙层应该立即响应手势
          return isVoiceMode && !isGeneratingDiary && isRecording;
        },
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // 一旦开始响应，就一直响应移动事件
          // 或者如果移动距离足够大，也响应（用于捕获从按钮开始的手势）
          return (
            isVoiceMode &&
            !isGeneratingDiary &&
            isRecording &&
            (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5)
          );
        },
        onPanResponderGrant: (evt) => {
          if (isVoiceMode && !isGeneratingDiary && isRecording) {
            // 如果还没有初始化起始位置（从按钮的PanResponder），则使用当前触摸位置
            if (startYRef.current === 0) {
              startYRef.current = evt.nativeEvent.pageY;
            }
            currentYRef.current = evt.nativeEvent.pageY;
            // 不重置 shouldCancelRef，保持之前的状态
          }
        },
        onPanResponderMove: (evt) => {
          if (isVoiceMode && !isGeneratingDiary && isRecording) {
            // 更新当前触摸位置
            currentYRef.current = evt.nativeEvent.pageY;
            // 计算从初始位置到当前位置的垂直距离
            const deltaY = startYRef.current - currentYRef.current;
            const movingUp = deltaY > 50; // 向上移动超过50px认为是上滑
            shouldCancelRef.current = movingUp; // 更新取消状态
            
            console.log('onPanResponderMove', { 
              deltaY, 
              movingUp, 
              startY: startYRef.current, 
              currentY: currentYRef.current 
            });
            
            // 使用函数式更新确保获取最新状态
            setIsMovingUp((prevMovingUp) => {
              if (movingUp !== prevMovingUp) {
                console.log('isMovingUp changed:', { from: prevMovingUp, to: movingUp });
                onVoiceButtonMove(movingUp);
                return movingUp;
              }
              return prevMovingUp;
            });
          }
        },
        onPanResponderRelease: () => {
          // 在蒙层上释放时处理录音结束
          console.log('onPanResponderRelease called', { isRecording, shouldCancel: shouldCancelRef.current });
          if (isRecording) {
            const shouldCancel = shouldCancelRef.current;
            onVoiceButtonPressOut(shouldCancel);
            // 重置状态
            setIsMovingUp(false);
            shouldCancelRef.current = false;
            startYRef.current = 0;
            currentYRef.current = 0;
          }
        },
        onPanResponderTerminate: () => {
          // 终止时也处理录音结束
          console.log('onPanResponderTerminate called', { isRecording, shouldCancel: shouldCancelRef.current });
          if (isRecording) {
            const shouldCancel = shouldCancelRef.current;
            onVoiceButtonPressOut(shouldCancel);
            // 重置状态
            setIsMovingUp(false);
            shouldCancelRef.current = false;
            startYRef.current = 0;
            currentYRef.current = 0;
          }
        },
      }),
    [isVoiceMode, isGeneratingDiary, isRecording, onVoiceButtonMove, onVoiceButtonPressOut]
  );

  // 录音状态提示文字
  const getRecordingHintText = () => {
    if (isMovingUp) {
      return '松手取消';
    }
    return '松手发送 上移取消';
  };

  return (
    <View style={styles.inputContainer}>
      {/* 录音状态提示文字 */}
      {isRecording && (
        <View style={styles.recordingHintContainer}>
          <Text style={[styles.recordingHintText, isMovingUp && styles.recordingHintTextCancel]}>
            {getRecordingHintText()}
          </Text>
        </View>
      )}

      {/* 左侧输入区域 */}
      <View 
        style={[
          styles.inputWrapper,
          isVoiceMode && styles.inputWrapperVoiceMode,
          isRecording && !isMovingUp && styles.inputWrapperRecording,
          isRecording && isMovingUp && styles.inputWrapperRecordingCancel,
          showExpandedStyle && styles.inputWrapperExpanded,
          showExpandedStyle && styles.inputWrapperFlexStart,
        ]}
      >
        {/* 左侧切换图标 */}
        <TouchableOpacity
          style={[
            styles.modeToggleButton,
          ]}
          onPress={onToggleInputMode}
          activeOpacity={0.7}
          disabled={isGeneratingDiary || isRecording}
        >
          <Image
            source={{ uri: isVoiceMode ? KEYBOARD_ICON_URL : RADIO_ICON_URL }}
            style={styles.modeToggleIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* 右侧内容区域 */}
        {isVoiceMode ? (
          <View 
            style={styles.voiceContent}
            {...buttonPanResponder.panHandlers}
          >
            <TouchableOpacity
              style={styles.voiceContentTouchable}
              activeOpacity={1}
              disabled={isGeneratingDiary}
            >
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                {dotPositions.map((dot, index) => (
                  <AnimatedDot
                    key={index}
                    dot={dot}
                    index={index}
                    isMovingUp={isMovingUp}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.voiceText}>按住 说话</Text>
            )}
          </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.textContent}>
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="输入想要记录的内容"
              placeholderTextColor={Colors.light.icon}
              value={inputText}
              onChangeText={onInputChange}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                // 延迟检查，确保键盘状态已更新
                setTimeout(() => {
                  if (!isKeyboardVisible) {
                    setIsInputFocused(false);
                  }
                }, 100);
              }}
              multiline
              maxLength={500}
              editable={!isGeneratingDiary}
            />
            
          </View>
        )}
        {showSendButton && (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                ]}
                onPress={onSend}
                disabled={isSending || isGeneratingDiary || !inputText.trim()}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FF326C', '#FFD99A']}
                  locations={[0.286, 0.9562]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.5, y: 0.866 }} // 120.16度的近似值（从左上到右下偏下）
                  style={styles.sendButtonGradient}
                >
                  <Image
                    source={{ uri: SEND_MSG_ICON_URL }}
                    style={styles.sendButtonIcon}
                    resizeMode="contain"
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
      </View>

      {/* 右侧图片按钮 - 键盘显示时隐藏 */}
      {!showExpandedStyle && (
        <TouchableOpacity
          style={styles.imageButton}
          onPress={onImagePicker}
          activeOpacity={0.7}
          disabled={isGeneratingDiary || isRecording}
        >
          <Image
            source={{ uri: PIC_ICON_URL }}
            style={styles.imageButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {/* 透明蒙层 - 录音时显示，用于捕获手势 */}
      <Modal
        visible={isVoiceMode && isRecording}
        transparent={true}
        animationType="none"
        onRequestClose={() => {}}
      >
        <View 
          style={styles.overlay}
          {...overlayPanResponder.panHandlers}
        >
          {/* 透明蒙层，不显示任何内容，只用于捕获手势 */}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: scaleSize(16),
    paddingTop: scaleSize(12),
    paddingBottom: 0,
    // backgroundColor: Colors.light.background,
    gap: scaleSize(8),
    position: 'relative',
  },
  recordingHintContainer: {
    position: 'absolute',
    top: scaleSize(-30),
    left: scaleSize(16),
    right: scaleSize(16),
    alignItems: 'center',
  },
  recordingHintText: {
    fontSize: scaleSize(14),
    color: Colors.light.text,
    fontWeight: '400',
  },
  recordingHintTextCancel: {
    color: '#FF326C',
  },
  inputWrapper: {
    width: scaleSize(291),
    minHeight: scaleSize(52),
    // height: scaleSize(52),
    borderRadius: scaleSize(20),
    backgroundColor: '#FAFAFA',
    paddingTop: scaleSize(8),
    paddingRight: scaleSize(8),
    paddingBottom: scaleSize(8),
    paddingLeft: scaleSize(14),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(8),
  },
  inputWrapperVoiceMode: {
    height: 52,
  },
  inputWrapperFlexStart: {
    alignItems: 'flex-start',
  },
  inputWrapperExpanded: {
    width: '100%',
    flex: 1,
    minHeight: scaleSize(52),
    height: 'auto',
  },
  inputWrapperRecording: {
    backgroundColor: '#FFFFFF',
  },
  inputWrapperRecordingCancel: {
    backgroundColor: '#FF326C',
  },
  modeToggleButton: {
    width: scaleSize(20),
    height: scaleSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: scaleSize(8),
  },
  modeToggleButtonBottom: {
    marginBottom: scaleSize(2),
  },
  modeToggleIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  textContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    textAlignVertical: 'center',
    gap: scaleSize(8),
  },
  textInput: {
    flex: 1,
    fontSize: scaleSize(16),
    lineHeight: scaleSize(20),
    color: Colors.light.text,
    padding: 0,
    textAlignVertical: 'center',
    minHeight: scaleSize(24),
    maxHeight: scaleSize(120), // 约5行高度（每行约24px）
  },
  sendButton: {
    width: scaleSize(36),
    height: scaleSize(36),
    borderRadius: scaleSize(40),
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  sendButtonBottom: {
    marginBottom: scaleSize(2),
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(8),
  },
  sendButtonIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  voiceContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceContentTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceText: {
    fontSize: scaleSize(16),
    color: Colors.light.text,
    fontWeight: '400',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSize(3),
    width: '100%',
  },
  recordingDot: {
    width: scaleSize(4),
    height: scaleSize(4),
    borderRadius: scaleSize(2),
    backgroundColor: '#FF326C', // 粉色点
  },
  recordingDotCancel: {
    backgroundColor: '#FFFFFF', // 取消时显示白色点
  },
  imageButton: {
    width: 52,
    height: 52,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  imageButtonExpanded: {
    alignSelf: 'flex-end',
    marginBottom: scaleSize(2),
  },
  imageButtonIcon: {
    width: 20,
    height: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    // 透明蒙层，用于捕获手势
  },
});

