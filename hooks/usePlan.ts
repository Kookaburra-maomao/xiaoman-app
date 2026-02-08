/**
 * 计划相关业务逻辑Hook
 */

import { CYCLE_MAP } from '@/constants/plan';
import { useAuth } from '@/contexts/AuthContext';
import * as chatService from '@/services/chatService';
import * as imageService from '@/services/imageService';
import * as planService from '@/services/planService';
import { CreatePlanForm, Plan, SuccessModalData } from '@/types/plan';
import { calculateFinishTimes, calculateKeepTimes } from '@/utils/plan-utils';
import { AssistantHistoryItem, addPendingConversation, getAssistantHistory, incrementUnreadCount, saveAssistantHistory } from '@/utils/unread-messages';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export const usePlan = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // 获取计划列表
  const fetchPlans = useCallback(async (): Promise<Plan[]> => {
    if (!user?.id) return [];

    try {
      setLoading(true);
      const plansData = await planService.fetchActivePlans(user.id);
      
      // 创建两个数组：未完成的计划和已完成的计划
      const uncompletedPlans: (Plan & { isFinish: boolean })[] = [];
      const completedPlans: (Plan & { isFinish: boolean })[] = [];
      
      // 遍历所有计划，分类到两个数组中
      plansData.forEach((plan: Plan) => {
        let isCompleted = false;
        
        // 判断是否已完成
        if (plan.cycle === 'no') {
          // 非循环计划：如果 records 长度大于 1，算作已完成
          isCompleted = (plan.records?.length || 0) > 1;
        } else {
          // 循环计划：计算当前周期的完成次数
          const finishTimes = calculateFinishTimes(plan);
          isCompleted = finishTimes >= plan.times;
        }
        
        // 根据完成状态放入对应数组，并添加 isFinish 字段
        const planWithFinish = { ...plan, isFinish: isCompleted };
        if (isCompleted) {
          completedPlans.push(planWithFinish);
        } else {
          uncompletedPlans.push(planWithFinish);
        }
      });
      
      // 将已完成的计划数组拼接到未完成的计划数组后面
      const sortedPlans = [...uncompletedPlans, ...completedPlans];
      
      setPlans(sortedPlans);
      return sortedPlans;
    } catch (error: any) {
      console.error('获取计划列表失败:', error);
      Alert.alert('错误', error.message || '获取计划列表失败，请重试');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 发送打卡消息并获取小满回复
  const sendCheckInMessage = useCallback(async (planName: string) => {
    try {
      const userMessage = `我完成了${planName}打卡`;
      const userId = user?.id || '';

      // 获取对话tab的assistantHistory
      const assistantHistory = await getAssistantHistory();

      // 调用聊天接口
      const fullText = await chatService.sendChatMessage(userMessage, userId, assistantHistory);

      // 将用户消息和系统回复添加到assistantHistory
      const updatedHistory: AssistantHistoryItem[] = [
        ...assistantHistory, 
        { role: 'user', content: userMessage }, 
        { role: 'assistant', content: fullText }
      ];
      await saveAssistantHistory(updatedHistory);
      
      // 将用户消息和系统回复存储到待发送对话中
      await addPendingConversation(userMessage, fullText);
    } catch (error) {
      console.error('发送打卡消息失败:', error);
      // 即使失败也添加用户消息，系统回复为空
      await addPendingConversation(`我完成了${planName}打卡`, '');
    }
  }, [user?.id]);

  // 打卡
  const handleCheckIn = useCallback(async (plan: Plan): Promise<SuccessModalData | null> => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return null;
    }

    try {
      setLoading(true);
      
      // 创建计划记录
      await planService.createPlanRecord(plan.id);

      // 更新计划
      const updateData: any = {
        name: plan.name,
      };
      
      // 如果是 cycle === 'no' 的计划，传入 state: 'finish'
      if (plan.cycle === 'no') {
        updateData.state = 'finish';
      }
      
      await planService.updatePlan(plan.id, updateData);

      // 重新获取列表
      const updatedPlans = await fetchPlans();

      // 从更新后的列表中获取最新的 plan 数据
      const updatedPlan = updatedPlans.find((p) => p.id === plan.id) || plan;

      // 计算完成次数（基于更新后的数据，包含本次打卡）
      const finishTimes = calculateFinishTimes(updatedPlan);
      const { totalTimes } = calculateKeepTimes(updatedPlan);

      // 准备弹窗数据
      const modalData: SuccessModalData = {
        totalTimes: totalTimes,
        planName: plan.name,
        cycle: CYCLE_MAP[plan.cycle] || plan.cycle,
        cycleType: plan.cycle,
        finishTimes: finishTimes,
        times: plan.times,
      };

      // 异步发送打卡消息（不阻塞弹窗显示）
      (async () => {
        try {
          // 增加未读消息数量
          await incrementUnreadCount();
          // 发送用户消息并获取小满的回复
          await sendCheckInMessage(plan.name);
        } catch (error) {
          console.error('发送打卡消息失败:', error);
        }
      })();

      // 立即返回成功弹窗数据，不等待消息发送完成
      return modalData;
    } catch (error: any) {
      console.error('打卡失败:', error);
      Alert.alert('错误', error.message || '打卡失败，请重试');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPlans, sendCheckInMessage]);

  // 创建计划
  const handleCreatePlan = useCallback(async (formData: CreatePlanForm): Promise<boolean> => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return false;
    }

    if (!formData.name.trim()) {
      Alert.alert('提示', '请输入计划标题');
      return false;
    }

    if (formData.cycle !== 'no' && formData.times < 1) {
      Alert.alert('提示', '请输入至少完成次数');
      return false;
    }

    try {
      setLoading(true);

      await planService.createPlan({
        ...formData,
        user_id: user.id,
      });

      Alert.alert('成功', '创建计划成功');
      await fetchPlans();
      return true;
    } catch (error: any) {
      console.error('创建计划失败:', error);
      Alert.alert('错误', error.message || '创建计划失败，请重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPlans]);

  // 上传图片并调用图片理解
  const handleUploadImage = useCallback(async (imageUri: string): Promise<{ imageUrl: string; vlContent: string } | null> => {
    if (!user?.id) {
      Alert.alert('错误', '用户信息不存在');
      return null;
    }

    try {
      // 上传图片
      const uploadResult = await imageService.uploadImage(imageUri);
      const imageUrl = uploadResult.url;
      
      // 增加未读消息数量
      await incrementUnreadCount();
      
      // 调用图片理解接口
      try {
        const assistantHistory = await getAssistantHistory();
        const vlContent = await chatService.callVL(imageUrl, user.id, assistantHistory);
        
        // 将小满的图片理解回复添加到assistantHistory
        const updatedHistory: AssistantHistoryItem[] = [
          ...assistantHistory, 
          { role: 'assistant', content: vlContent }
        ];
        await saveAssistantHistory(updatedHistory);
        
        // 将图片作为用户消息和系统回复存储到待发送对话中
        await addPendingConversation('', vlContent, imageUrl);
        
        return { imageUrl, vlContent };
      } catch (vlError: any) {
        console.error('图片理解失败:', vlError);
        // 即使图片理解失败，也存储图片消息（系统回复为空）
        await addPendingConversation('', '', imageUrl);
        return { imageUrl, vlContent: '' };
      }
    } catch (error: any) {
      console.error('上传图片失败:', error);
      Alert.alert('错误', error.message || '图片上传失败，请重试');
      return null;
    }
  }, [user?.id]);

  return {
    plans,
    loading,
    showAll,
    setShowAll,
    fetchPlans,
    handleCheckIn,
    handleCreatePlan,
    handleUploadImage,
  };
};

