/**
 * 计划列表组件
 */

import { ICON_DOT_URL, RIGHT_ICON_URL } from '@/constants/urls';
import { Message } from '@/types/chat';
import { scaleSize } from '@/utils/screen';
import { Image, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlanListProps {
  message: Message;
  onAddToPlan: () => void;
}

export default function PlanList({ message, onAddToPlan }: PlanListProps) {
  if (!message.plans || !message.plans.plans || message.plans.plans.length === 0) {
    return null;
  }

  // 处理添加计划按钮点击
  const handleAddToPlan = () => {
    // 先收起键盘
    Keyboard.dismiss();
    // 立即执行添加计划
    onAddToPlan();
  };

  return (
    <View style={styles.container}>
      {/* 计划列表 */}
      <View style={styles.plansContainer}>
        {message.plans.plans.map((plan, index) => (
          <View key={index} style={styles.planItem}>
            <Image
              source={{ uri: ICON_DOT_URL }}
              style={styles.planItemIcon}
              resizeMode="contain"
            />
            <Text style={styles.planName}>
              {plan.plan_name}
            </Text>
            {plan.repeat?.plan_quality_score !== undefined && (
              <Text style={styles.qualityScore}>
                推荐指数:{plan.repeat.plan_quality_score}分
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* 添加到我的计划按钮 */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddToPlan} activeOpacity={0.7}>
        <Text style={styles.addButtonText}>去添加计划</Text>
        <Image
          source={{ uri: RIGHT_ICON_URL }}
          style={styles.addButtonIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: scaleSize(0),
    marginBottom: scaleSize(8),
    paddingLeft: scaleSize(20),
  },
  plansContainer: {
    marginBottom: scaleSize(0),
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(4),
    paddingVertical: scaleSize(8),
    borderRadius: scaleSize(8),
  },
  planItemIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
    marginRight: scaleSize(8),
  },
  planName: {
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    color: '#222222',
    fontFamily: 'PingFang SC',
    flex: 1,
  },
  qualityScore: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: '#999999',
    fontFamily: 'PingFang SC',
    marginRight: scaleSize(20),
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(122),
    height: scaleSize(34),
    backgroundColor: '#000000',
    borderRadius: scaleSize(10),
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(8),
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    fontWeight: '400',
    fontFamily: 'PingFang SC',
  },
  addButtonIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginLeft: scaleSize(4),
  },
});

