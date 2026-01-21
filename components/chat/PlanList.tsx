/**
 * 计划列表组件
 */

import { Colors } from '@/constants/theme';
import { Message } from '@/types/chat';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlanListProps {
  message: Message;
  onAddToPlan: () => void;
}

export default function PlanList({ message, onAddToPlan }: PlanListProps) {
  if (!message.plans || !message.plans.plans || message.plans.plans.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 计划列表 */}
      <View style={styles.plansContainer}>
        {message.plans.plans.map((plan, index) => (
          <View key={index} style={styles.planItem}>
            <Text style={styles.planName}>
              {plan.plan_name}
              {plan.repeat && plan.repeat.times_per_unit > 0 && ` ${plan.repeat.times_per_unit}次`}
            </Text>
          </View>
        ))}
      </View>

      {/* 添加到我的计划按钮 */}
      <TouchableOpacity style={styles.addButton} onPress={onAddToPlan} activeOpacity={0.7}>
        <Text style={styles.addButtonText}>添加到我的计划</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
    paddingLeft: 4,
  },
  plansContainer: {
    marginBottom: 12,
  },
  planItem: {
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  planName: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  addButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 20,
    minWidth: 120,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

