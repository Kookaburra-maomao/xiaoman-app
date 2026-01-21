/**
 * 添加计划全屏弹窗组件
 */

import { Colors } from '@/constants/theme';
import { GeneratedPlan, GeneratePlanResponse } from '@/services/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as planService from '@/services/planService';
import DatePicker from '@/components/plan/DatePicker';
import { formatDateForDisplay } from '@/utils/date-utils';

interface PlanAddModalProps {
  visible: boolean;
  planData: GeneratePlanResponse | null;
  userId: string;
  onClose: () => void;
  onPlanAdded: (planIndex: number) => void;
}

export default function PlanAddModal({
  visible,
  planData,
  userId,
  onClose,
  onPlanAdded,
}: PlanAddModalProps) {
  const [editingPlans, setEditingPlans] = useState<Array<{
    plan_name: string;
    plan_description: string;
    times: number;
    cycle: 'day' | 'week' | 'month' | 'year' | 'no';
    gmt_limit: string;
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
      await planService.createPlan({
        name: plan.plan_name.trim(),
        description: plan.plan_description.trim() || plan.plan_name.trim(),
        cycle: plan.cycle,
        times: plan.cycle === 'no' ? 0 : plan.times,
        gmt_limit: plan.gmt_limit || '',
        user_id: userId,
      } as any);

      Alert.alert('成功', '创建计划成功');
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>建议计划</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* 内容区域 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {editingPlans.map((plan, index) => (
            <View key={index} style={styles.planCard}>
              {/* 计划名称 */}
              <TextInput
                style={styles.planNameInput}
                value={plan.plan_name}
                onChangeText={(text) => updatePlanName(index, text)}
                placeholder="计划名称"
                placeholderTextColor={Colors.light.icon}
              />

              {/* 计划描述 */}
              <TextInput
                style={styles.planDescriptionInput}
                value={plan.plan_description}
                onChangeText={(text) => updatePlanDescription(index, text)}
                placeholder="详细信息"
                placeholderTextColor={Colors.light.icon}
                multiline
                numberOfLines={3}
              />

              {/* 次数 */}
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.text} />
                  <Text style={styles.settingLabel}>次数</Text>
                </View>
                <View style={styles.settingRight}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => updatePlanTimes(index, plan.times - 1)}
                  >
                    <Ionicons name="chevron-down" size={16} color={Colors.light.text} />
                  </TouchableOpacity>
                  <Text style={styles.settingValue}>{plan.times}次</Text>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => updatePlanTimes(index, plan.times + 1)}
                  >
                    <Ionicons name="chevron-up" size={16} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 重复 */}
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="refresh" size={20} color={Colors.light.text} />
                  <Text style={styles.settingLabel}>重复</Text>
                </View>
                <View style={styles.settingRight}>
                  <TouchableOpacity
                    style={styles.cycleSelector}
                    onPress={() => {
                      const currentIndex = cycleOptions.findIndex((opt) => opt.value === plan.cycle);
                      const nextIndex = (currentIndex + 1) % cycleOptions.length;
                      updatePlanCycle(index, cycleOptions[nextIndex].value);
                    }}
                  >
                    <Text style={styles.settingValue}>
                      {cycleOptions.find((opt) => opt.value === plan.cycle)?.label || '每天'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 截止时间 */}
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.light.text} />
                  <Text style={styles.settingLabel}>截止时间</Text>
                </View>
                <View style={styles.settingRight}>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      setCurrentDatePickerIndex(index);
                      setShowDatePicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateInputText, !plan.gmt_limit && styles.dateInputPlaceholder]}>
                      {plan.gmt_limit ? formatDateForDisplay(plan.gmt_limit) : '请选择截止日期'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.light.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 日期选择器 */}
              {currentDatePickerIndex === index && (
                <DatePicker
                  visible={showDatePicker}
                  selectedDate={plan.gmt_limit}
                  onConfirm={handleConfirmDate}
                  onCancel={handleCancelDate}
                />
              )}

              {/* 按钮 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => removePlan(index)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.addButton]}
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planNameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  planDescriptionInput: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 16,
    paddingVertical: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    padding: 4,
  },
  settingValue: {
    fontSize: 16,
    color: Colors.light.text,
    marginHorizontal: 12,
    minWidth: 60,
    textAlign: 'center',
  },
  cycleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateInputText: {
    fontSize: 16,
    color: Colors.light.text,
    marginRight: 8,
  },
  dateInputPlaceholder: {
    color: Colors.light.icon,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.text,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: Colors.light.text,
  },
  addButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

