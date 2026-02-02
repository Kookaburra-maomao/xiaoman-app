/**
 * 添加计划全屏弹窗组件
 */

import { CYCLE_MAP } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import { FALLBACK_IMAGE_BASE_URL, ICON_RETURN_URL } from '@/constants/urls';
import { GeneratePlanResponse } from '@/services/chatService';
import * as planService from '@/services/planService';
import { emitPlanRefresh } from '@/utils/planRefreshEvent';
import { get } from '@/utils/request';
import { scaleSize } from '@/utils/screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlanAddModalProps {
  visible: boolean;
  planData: GeneratePlanResponse | null;
  userId: string;
  onClose: () => void;
  onPlanAdded: (planIndex: number) => void;
  onPlanCreated?: () => void; // 计划创建成功后的回调
}

export default function PlanAddModal({
  visible,
  planData,
  userId,
  onClose,
  onPlanAdded,
  onPlanCreated,
}: PlanAddModalProps) {
  const [editingPlans, setEditingPlans] = useState<Array<{
    plan_name: string;
    plan_description: string;
    times: number;
    cycle: 'day' | 'week' | 'month' | 'year' | 'no';
    gmt_limit: string;
    plan_tag?: string; // 计划标签
    image?: string; // 计划图片
    image_preview?: string; // 计划预览图片
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDatePickerIndex, setCurrentDatePickerIndex] = useState<number | null>(null);

  // 初始化编辑计划数据
  useEffect(() => {
    if (planData && planData.plans && visible) {
      const initialPlans = planData.plans.map((plan) => ({
        plan_name: plan.plan_name,
        plan_description: plan.plan_description,
        times: plan.repeat?.times_per_unit || 1,
        cycle: plan.repeat?.repeat_unit || 'day',
        gmt_limit: '',
      }));
      setEditingPlans(initialPlans);
      setIsInitialized(true);
      
      // 遍历所有计划名称，调用接口获取 plan_tag 并拼接图片 URL，直接保存到 plan item 中
      const fetchPlanTags = async () => {
        try {
          const plansWithImages = await Promise.all(
            initialPlans.map(async (plan) => {
              try {
                const result = await get('/api/chat/plan-to-tag', {
                  plan: plan.plan_name,
                });
                if (result.code === 200 && result.data?.plan_tag) {
                  const planTag = result.data.plan_tag;
                  // 基于计划名称生成稳定的随机数（1-5），确保相同计划总是显示相同的图片
                  let hash = 0;
                  for (let i = 0; i < plan.plan_name.length; i++) {
                    hash = ((hash << 5) - hash) + plan.plan_name.charCodeAt(i);
                    hash = hash & hash; // Convert to 32bit integer
                  }
                  const randomNum = (Math.abs(hash) % 5) + 1; // 生成 1-5 的稳定随机数
                  
                  // 将 plan_tag、image 和 image_preview 直接保存到 plan item 中
                  return {
                    ...plan,
                    plan_tag: planTag,
                    image: getPlanImageUrl(planTag, randomNum),
                    image_preview: getPlanImagePreviewUrl(planTag, randomNum),
                  };
                }
                // 如果获取失败，返回原始 plan（不包含图片信息）
                return plan;
              } catch (error) {
                console.error(`获取计划 ${plan.plan_name} 的 tag 失败:`, error);
                // 如果获取失败，返回原始 plan（不包含图片信息）
                return plan;
              }
            })
          );
          setEditingPlans(plansWithImages);
        } catch (error) {
          console.error('批量获取计划 tag 失败:', error);
          // 如果批量获取失败，使用原始 plans
          setEditingPlans(initialPlans);
        }
      };
      
      fetchPlanTags();
    } else if (!visible) {
      // 弹窗关闭时重置状态
      setIsInitialized(false);
      setEditingPlans([]);
      setShowDatePicker(false);
      setCurrentDatePickerIndex(null);
    }
  }, [planData, visible]);

  // 监听所有计划被移除的情况，自动关闭弹窗
  useEffect(() => {
    if (isInitialized && editingPlans.length === 0 && visible) {
      onClose();
    }
  }, [editingPlans.length, isInitialized, visible, onClose]);

  // 当没有计划数据或编辑计划为空时,不显示内容
  if (!planData || !planData.plans || planData.plans.length === 0) {
    return null;
  }

  // 如果还未初始化完成，不渲染内容（避免弹窗瞬间消失）
  if (!isInitialized || editingPlans.length === 0) {
    return null;
  }

  // 更新计划名称
  const updatePlanName = (index: number, name: string) => {
    const newPlans = [...editingPlans];
    newPlans[index].plan_name = name;
    setEditingPlans(newPlans);
  };

  // 更新计划描述
  const updatePlanDescription = (index: number, description: string) => {
    const newPlans = [...editingPlans];
    newPlans[index].plan_description = description;
    setEditingPlans(newPlans);
  };

  // 更新次数
  const updatePlanTimes = (index: number, times: number) => {
    const newPlans = [...editingPlans];
    newPlans[index].times = Math.max(1, Math.min(10, times));
    setEditingPlans(newPlans);
  };

  // 更新重复周期
  const updatePlanCycle = (index: number, cycle: 'day' | 'week' | 'month' | 'year' | 'no') => {
    const newPlans = [...editingPlans];
    newPlans[index].cycle = cycle;
    setEditingPlans(newPlans);
  };

  // 更新截止时间
  const updatePlanGmtLimit = (index: number, gmt_limit: string) => {
    const newPlans = [...editingPlans];
    newPlans[index].gmt_limit = gmt_limit;
    setEditingPlans(newPlans);
  };

  // 处理日期选择确认
  const handleConfirmDate = (date: string) => {
    if (currentDatePickerIndex !== null) {
      updatePlanGmtLimit(currentDatePickerIndex, date);
      setShowDatePicker(false);
      setCurrentDatePickerIndex(null);
    }
  };

  // 处理日期选择取消
  const handleCancelDate = () => {
    setShowDatePicker(false);
    setCurrentDatePickerIndex(null);
  };

  // 删除计划
  const removePlan = (index: number) => {
    const newPlans = editingPlans.filter((_, i) => i !== index);
    setEditingPlans(newPlans);
    onPlanAdded(index);
    // 如果所有计划都被移除，关闭弹窗
    if (newPlans.length === 0) {
      onClose();
    }
  };

  // 添加计划
  const handleAddPlan = async (index: number) => {
    const plan = editingPlans[index];
    if (!plan.plan_name.trim()) {
      Alert.alert('提示', '请输入计划名称');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 构建创建计划的参数
      const createPlanParams: any = {
        name: plan.plan_name.trim(),
        description: '', // 始终传空字符串
        cycle: plan.cycle,
        times: plan.cycle === 'no' ? 0 : plan.times,
        gmt_limit: plan.gmt_limit || '',
        user_id: userId,
      };
      
      // 如果 plan item 中有图片信息，直接使用
      if (plan.image && plan.image_preview) {
        createPlanParams.image = plan.image;
        createPlanParams.image_preview = plan.image_preview;
      } else if (plan.image) {
        // 如果只有 image，使用 image
        createPlanParams.image = plan.image;
      } else {
        // 否则使用默认图片（基于索引生成稳定随机数）
        const randomNum = (index % 18) + 1;
        createPlanParams.image = `${FALLBACK_IMAGE_BASE_URL}${randomNum}.png`;
      }
      
      await planService.createPlan(createPlanParams);

      Alert.alert('成功', '创建计划成功');
      
      // 触发计划数据刷新事件，通知计划tab刷新数据
      emitPlanRefresh();
      
      // 通知计划创建成功，用于刷新计划tab的数据
      if (onPlanCreated) {
        onPlanCreated();
      }
      
      removePlan(index);
    } catch (error: any) {
      console.error('创建计划失败:', error);
      Alert.alert('错误', error.message || '创建计划失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cycleOptions: Array<{ label: string; value: 'day' | 'week' | 'month' | 'year' | 'no' }> = [
    { label: '不重复', value: 'no' },
    { label: '每天', value: 'day' },
    { label: '每周', value: 'week' },
    { label: '每月', value: 'month' },
    { label: '每年', value: 'year' },
  ];

  // 格式化截止日期
  const formatDeadline = (gmtLimit?: string): string => {
    if (!gmtLimit) return '';
    try {
      const date = new Date(gmtLimit);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `截止 ${year}年${month}月${day}日`;
    } catch {
      return '';
    }
  };

  // 获取计划图片URL（优先使用 image_preview，否则使用基于索引生成稳定随机数）
  const getPlanImageUrl = (index: number): string => {
    const plan = editingPlans[index];
    // 如果 plan item 中有 image_preview，优先使用
    if (plan?.image_preview) {
      return plan.image_preview;
    }
    // 如果 plan item 中有 image，使用 image
    if (plan?.image) {
      return plan.image;
    }
    // 否则使用基于索引生成稳定随机数
    const randomNum = (index % 18) + 1;
    return `${FALLBACK_IMAGE_BASE_URL}${randomNum}.png`;
  };

  // 获取循环文本
  const getCycleText = (cycle: 'day' | 'week' | 'month' | 'year' | 'no' | string | undefined, times: number): string => {
    // 如果 cycle 为空、'none'、'no' 或者 times 为空/0，显示"不循环"
    if (!cycle || cycle === 'none' || cycle === 'no' || !times || times === 0) {
      return '不循环';
    }
    // 否则显示"每{周期} {次数}次"
    return `每${CYCLE_MAP[cycle as 'day' | 'week' | 'month' | 'year'] || cycle} ${times}次`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* 头部 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Image
                source={{ uri: ICON_RETURN_URL }}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>建议计划</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          {/* 内容区域 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {editingPlans.map((plan, index) => (
              <View key={index} style={styles.planCard}>
                {/* 上部分：图片+信息展示 */}
                <View style={styles.planCardTop}>
                  {/* 左侧：计划图片 */}
                  <Image
                    source={{ uri: getPlanImageUrl(index) }}
                    style={styles.planImage}
                    resizeMode="cover"
                  />
                  
                  {/* 右侧：信息区域 */}
                  <View style={styles.planInfo}>
                    <TextInput
                      style={styles.planNameInput}
                      value={plan.plan_name}
                      onChangeText={(text) => updatePlanName(index, text)}
                      placeholder="计划名称"
                      placeholderTextColor={Colors.light.icon}
                    />
                    <Text style={styles.planCycleText}>
                      {getCycleText(plan.cycle, plan.times)}
                    </Text>
                    {plan.gmt_limit && (
                      <Text style={styles.planDeadlineText}>
                        {formatDeadline(plan.gmt_limit)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* 下部分：按钮功能 */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.modifyButton}
                    onPress={() => {
                      // TODO: 实现修改功能
                    }}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.modifyButtonText}>修改</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddPlan(index)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.addButtonText}>添加计划</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  headerTitle: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
  },
  headerPlaceholder: {
    width: scaleSize(40),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(16),
  },
  planCard: {
    height: scaleSize(134),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    paddingTop: scaleSize(8),
    paddingBottom: scaleSize(12),
    paddingLeft: scaleSize(12),
    paddingRight: scaleSize(12),
    marginBottom: scaleSize(16),
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  planImage: {
    width: scaleSize(60),
    height: scaleSize(60),
    borderRadius: scaleSize(8),
    backgroundColor: '#F5F5F5',
  },
  planInfo: {
    flex: 1,
    marginLeft: scaleSize(16),
    justifyContent: 'center',
  },
  planNameInput: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
    padding: 0,
    marginBottom: scaleSize(4),
  },
  planCycleText: {
    fontSize: scaleSize(14),
    color: Colors.light.icon,
    fontFamily: 'PingFang SC',
    marginBottom: scaleSize(2),
  },
  planDeadlineText: {
    fontSize: scaleSize(14),
    color: Colors.light.icon,
    fontFamily: 'PingFang SC',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scaleSize(20),
    marginTop: scaleSize(8),
  },
  modifyButton: {
    width: scaleSize(150),
    height: scaleSize(40),
    borderRadius: scaleSize(12),
    backgroundColor: '#DDDDDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifyButtonText: {
    fontSize: scaleSize(14),
    color: '#222222',
    fontFamily: 'PingFang SC',
    fontWeight: '400',
  },
  addButton: {
    width: scaleSize(150),
    height: scaleSize(40),
    borderRadius: scaleSize(12),
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: scaleSize(14),
    color: '#FFFFFF',
    fontFamily: 'PingFang SC',
    fontWeight: '400',
  },
});

