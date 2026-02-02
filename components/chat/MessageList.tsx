/**
 * 消息列表组件
 */

import { Message } from '@/types/chat';
import { scaleSize } from '@/utils/screen';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MessageItem from './MessageItem';
import PlanList from './PlanList';

const RIGHT_ICON_URL = 'http://xiaomanriji.com/api/files/xiaoman-icon-right.png';

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
        // 如果是已处理的计划相关系统消息，直接跳过渲染
        const isProcessedPlanMessage = message.type === 'system' && 
          message.plansProcessed && 
          message.text && 
          message.text.includes('日记生成完成') && 
          message.text.includes('计划');
        
        if (isProcessedPlanMessage) {
          return null; // 不渲染已处理的计划消息
        }
        
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
        
        // 判断是否显示计划列表（系统消息且有计划数据，且未被处理）
        const shouldShowPlanList = message.type === 'system' && 
          message.plans && 
          message.plans.plans && 
          message.plans.plans.length > 0 &&
          !message.plansProcessed; // 已处理的计划不显示
        
        // 只有在完整的系统消息、且后续没有用户消息、且后续没有未完成的系统消息、且没有计划数据或计划已处理时，才显示按钮
        const shouldShowGenerateButton = isCompleteSystemMessage && 
          !hasUserMessageAfter && 
          !hasIncompleteSystemMessageAfter &&
          !shouldShowPlanList && // 有计划数据的消息不显示生成日记按钮
          !message.plansProcessed; // 已处理的计划消息不显示生成日记按钮
        
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
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: scaleSize(8) }} />
                      <Text style={styles.generateDiaryButtonText}>正在生成中...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.generateDiaryButtonText}>生成日记</Text>
                      <Image
                        source={{ uri: RIGHT_ICON_URL }}
                        style={styles.generateDiaryButtonIcon}
                        resizeMode="contain"
                      />
                    </>
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
    paddingHorizontal: 0,
    paddingVertical: 16,
    gap: 12,
  },
  generateDiaryButtonContainer: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
    paddingLeft: scaleSize(20),
  },
  generateDiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(98),
    height: scaleSize(34),
    paddingLeft: scaleSize(16),
    paddingRight: scaleSize(12),
    backgroundColor: '#000000',
    borderRadius: scaleSize(10),
  },
  generateDiaryButtonDisabled: {
    opacity: 0.6,
  },
  generateDiaryButtonText: {
    color: '#FFFFFF',
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    fontWeight: '400',
    fontFamily: 'PingFang SC',
  },
  generateDiaryButtonIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginLeft: scaleSize(4),
  },
});

