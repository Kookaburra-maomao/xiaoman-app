/**
 * 消息列表组件
 */

import { Colors } from '@/constants/theme';
import { Message } from '@/types/chat';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MessageItem from './MessageItem';
import PlanList from './PlanList';

interface MessageListProps {
  messages: Message[];
  isGeneratingDiary: boolean;
  onGenerateDiary: () => void;
  onAddToPlan: (message: Message) => void;
}

export default function MessageList({ messages, isGeneratingDiary, onGenerateDiary, onAddToPlan }: MessageListProps) {
  return (
    <View style={styles.messagesContainer}>
      {messages.map((message, index) => {
        // 判断是否是完整的左侧系统消息（没有图片、有文本、不是"正在输入..."状态、且不在流式传输中）
        const isCompleteSystemMessage = message.type === 'system' && 
          !message.imageUrl && 
          message.text && 
          message.text.trim() !== '' &&
          message.text !== '正在输入...' &&
          !message.isStreaming; // 确保不在流式传输中
        
        // 检查后续是否有用户消息（如果有用户消息，按钮应该消失）
        const hasUserMessageAfter = messages.slice(index + 1).some(m => m.type === 'user');
        
        // 检查后续是否有未完成的系统消息（如果有"正在输入..."的系统消息或还在流式传输中，按钮应该消失）
        const hasIncompleteSystemMessageAfter = messages.slice(index + 1).some(m => 
          m.type === 'system' && (m.isStreaming || !m.text || m.text === '正在输入...')
        );
        
        // 判断是否显示计划列表（系统消息且有计划数据）
        const shouldShowPlanList = message.type === 'system' && 
          message.plans && 
          message.plans.plans && 
          message.plans.plans.length > 0;
        
        // 只有在完整的系统消息、且后续没有用户消息、且后续没有未完成的系统消息、且没有计划数据时，才显示按钮
        const shouldShowGenerateButton = isCompleteSystemMessage && 
          !hasUserMessageAfter && 
          !hasIncompleteSystemMessageAfter &&
          !shouldShowPlanList; // 有计划数据的消息不显示生成日记按钮
        
        return (
          <View key={message.id}>
            <MessageItem message={message} />
            
            {/* 显示计划列表 */}
            {shouldShowPlanList && (
              <PlanList message={message} onAddToPlan={() => onAddToPlan(message)} />
            )}
            
            {/* 在完整的左侧系统消息下方显示"生成日记"按钮 */}
            {shouldShowGenerateButton && (
              <View style={styles.generateDiaryButtonContainer}>
                <TouchableOpacity
                  style={[styles.generateDiaryButton, isGeneratingDiary && styles.generateDiaryButtonDisabled]}
                  onPress={onGenerateDiary}
                  disabled={isGeneratingDiary}
                  activeOpacity={0.7}
                >
                  {isGeneratingDiary ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.light.text} style={{ marginRight: 8 }} />
                      <Text style={styles.generateDiaryButtonText}>正在生成中...</Text>
                    </>
                  ) : (
                    <Text style={styles.generateDiaryButtonText}>生成日记</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  generateDiaryButtonContainer: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  generateDiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    minWidth: 120,
  },
  generateDiaryButtonDisabled: {
    opacity: 0.6,
  },
  generateDiaryButtonText: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '600',
  },
});

