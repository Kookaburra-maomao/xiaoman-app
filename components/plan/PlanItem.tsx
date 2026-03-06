/**
 * 计划列表项组件
 */

import { CYCLE_MAP } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import { FALLBACK_IMAGE_BASE_URL, getFullImageUrl, PIN_IMAGE_URL } from '@/constants/urls';
import { logByPosition } from '@/services/logService';
import { Plan } from '@/types/plan';
import { calculateFinishTimes } from '@/utils/plan-utils';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlanItemProps {
  plan: Plan & { isFinish?: boolean };
  onCheckIn: (plan: Plan) => void;
  loading?: boolean;
  userId?: string; // 用户ID，用于打点
}

export default function PlanItem({ plan, onCheckIn, loading = false, userId }: PlanItemProps) {
  const router = useRouter();
  const finishTimes = calculateFinishTimes(plan);
  const cycleText = CYCLE_MAP[plan.cycle] || plan.cycle;
  const isFinish = plan.isFinish || false;

  // 跳转到计划详情页
  const handlePlanDetail = () => {
    router.push({
      pathname: '/plan-detail',
      params: {
        planId: plan.id,
        planName: plan.name,
        planState: plan.state,
      },
    });
  };

  // 获取计划图片URL（如果没有则使用基于plan.id的稳定随机兜底图片）
  const planImageUrl = useMemo(() => {
    if (plan.image) {
      // 如果返回的是完整URL，直接使用；否则拼接API地址
      if (plan.image.startsWith('http://') || plan.image.startsWith('https://')) {
        return plan.image;
      }
      return getFullImageUrl(plan.image);
    }
    // 兜底：基于plan.id生成1-18的稳定随机数（相同plan.id总是返回相同的随机数）
    // 使用plan.id的hash值来生成稳定的随机数
    let hash = 0;
    for (let i = 0; i < plan.id.length; i++) {
      hash = ((hash << 5) - hash) + plan.id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const randomNum = (Math.abs(hash) % 18) + 1;
    return `${FALLBACK_IMAGE_BASE_URL}${randomNum}.png`;
  }, [plan.id, plan.image]);

  // 格式化截止日期
  const formatDeadline = (gmtLimit?: string, hasRecords: boolean = false): { date: string; daysRemaining: string } | null => {
    if (!gmtLimit) return null;
    
    try {
      const limitDate = new Date(gmtLimit);
      const year = limitDate.getFullYear();
      const month = limitDate.getMonth() + 1;
      const day = limitDate.getDate();
      const formattedDate = `${year}年${month}月${day}日`;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      limitDate.setHours(0, 0, 0, 0);
      
      const diffTime = limitDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let daysText = '';
      if (diffDays < 0) {
        daysText = '已过期';
      } else if (diffDays === 0) {
        daysText = '今天';
      } else {
        // 如果有记录，则不显示"还有xxx天"的信息
        if (hasRecords) {
          daysText = '';
        } else {
          daysText = `还有${diffDays}天`;
        }
      }
      
      return {
        date: formattedDate,
        daysRemaining: daysText,
      };
    } catch {
      return null;
    }
  };

  const hasRecords = plan.records && plan.records.length > 0;
  const deadlineInfo = formatDeadline(plan.gmt_limit, hasRecords);
  const isTop = plan.is_top === 'true';

  // 判断是否为周期任务
  const isCyclePlan = plan.cycle !== 'no';

  return (
    <TouchableOpacity
      style={styles.planItem}
      onPress={handlePlanDetail}
      activeOpacity={0.7}
    >
      <View style={styles.planRow}>
        {/* 左侧：图片和信息区域 */}
        <View style={styles.planLeft}>
          <View style={styles.planLeftContent}>
            <Image
              source={{ uri: planImageUrl }}
              style={styles.planImage}
              resizeMode="cover"
            />
            <View style={styles.planTextContainer}>
              {/* 计划名称 + 置顶icon */}
              <View style={styles.planNameRow}>
                <Text style={[styles.planName, isFinish && styles.planNameFinished]}>
                  {plan.name}
                </Text>
                {isTop && (
                  <Image
                    source={{ uri: PIN_IMAGE_URL }}
                    style={styles.pinIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
              
              {/* 目标每个周期几次 */}
              {isCyclePlan && (
                <Text style={styles.cycleText}>
                  每{cycleText} {plan.times}次
                </Text>
              )}
              
              {/* 截止日期 */}
              {deadlineInfo && (
                <Text style={styles.deadlineText}>
                  截止{deadlineInfo.date}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* 右侧：完成次数和交互按钮 */}
        <View style={styles.planRight}>
          {/* 本周期完成次数（仅周期任务显示） */}
          {isCyclePlan && (
            <Text style={styles.progressText}>
              {finishTimes}/{plan.times}
            </Text>
          )}
          
          {/* 交互按钮 */}
          <TouchableOpacity
            style={[
              styles.checkInButton,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (!isFinish) {
                // 打点：点击计划完成打卡
                if (userId) {
                  logByPosition('PLAN_DONE_CHECK' as any, userId);
                }
                onCheckIn(plan);
              }
            }}
            disabled={loading || isFinish}
            activeOpacity={0.7}
          >
            {isFinish && (
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-finish.png' }}
                style={styles.finishIcon}
                resizeMode="contain"
              />
            )}
            {!isFinish && isCyclePlan && (
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-add.png' }}
                style={styles.addIcon}
                resizeMode="contain"
              />
            )}
            {!isFinish && !isCyclePlan && (
              <Image
                source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-check.png' }}
                style={styles.checkIcon}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  planItem: {
    backgroundColor: '#F1F1F1',
    paddingHorizontal: scaleSize(10),
    paddingVertical: scaleSize(10),
    marginBottom: scaleSize(6),
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flex: 1,
    marginRight: scaleSize(12),
  },
  planLeftContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scaleSize(12),
  },
  planImage: {
    width: scaleSize(60),
    height: scaleSize(60),
    borderRadius: scaleSize(8),
    backgroundColor: '#F5F5F5',
  },
  planTextContainer: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: scaleSize(2),
  },
  planName: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(22),
    fontWeight: '600',
    color: Colors.light.text,
  },
  planNameFinished: {
    color: '#999999', // 已完成计划名称用灰色
  },
  pinIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
    marginLeft: scaleSize(4),
  },
  cycleText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),

    color: Colors.light.icon,
    marginBottom: scaleSize(2),
  },
  deadlineText: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: Colors.light.icon,
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(12),
    alignSelf: 'center',
  },
  progressText: {
    fontSize: scaleSize(14),
    color: Colors.light.icon,
  },
  checkInButton: {
    width: scaleSize(20),
    height: scaleSize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },

  addIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  checkIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
  finishIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
  },
});
