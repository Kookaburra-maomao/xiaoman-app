/**
 * 聊天输入组件
 */

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ChatInputProps {
  inputText: string;
  isVoiceMode: boolean;
  isRecording: boolean;
  recordingDuration: number;
  isSending: boolean;
  isGeneratingDiary: boolean;
  onInputChange: (text: string) => void;
  onToggleInputMode: () => void;
  onVoiceButtonPress: () => void;
  onSend: () => void;
  onImagePicker: () => void;
}

export default function ChatInput({
  inputText,
  isVoiceMode,
  isRecording,
  recordingDuration,
  isSending,
  isGeneratingDiary,
  onInputChange,
  onToggleInputMode,
  onVoiceButtonPress,
  onSend,
  onImagePicker,
}: ChatInputProps) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        {isVoiceMode ? (
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
            onPress={onVoiceButtonPress}
            activeOpacity={0.7}
            disabled={isGeneratingDiary}
          >
            <Ionicons 
              name={isRecording ? "stop-circle" : "mic"} 
              size={24} 
              color={isRecording ? "#FF3B30" : Colors.light.tint} 
            />
            <Text style={styles.voiceButtonText}>
              {isRecording ? `录音中... ${recordingDuration}秒` : '点击说话'}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.textInput}
              placeholder="输入内容..."
              placeholderTextColor={Colors.light.icon}
              value={inputText}
              onChangeText={onInputChange}
              multiline
              maxLength={500}
            />
            {inputText.trim() && (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={onSend}
                disabled={isSending || isGeneratingDiary}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={isSending ? Colors.light.icon : '#FFFFFF'} 
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.inputModeButton}
        onPress={onToggleInputMode}
        activeOpacity={0.7}
        disabled={isGeneratingDiary}
      >
        <Ionicons
          name={isVoiceMode ? 'keypad-outline' : 'mic-outline'}
          size={24}
          color={Colors.light.tint}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.imageButton}
        onPress={onImagePicker}
        activeOpacity={0.7}
        disabled={isGeneratingDiary}
      >
        <Ionicons name="images-outline" size={24} color={Colors.light.tint} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: Colors.light.background,
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    padding: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voiceButtonRecording: {
    opacity: 0.8,
  },
  voiceButtonText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '500',
  },
  inputModeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

