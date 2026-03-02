import { CYCLE_MAP } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import { FALLBACK_IMAGE_BASE_URL, PIN_IMAGE_URL, PIN_NORMAL_IMAGE_URL } from '@/constants/urls';
import { useAuth } from '@/contexts/AuthContext';
import { get, put } from '@/utils/request';
import { scaleSize } from '@/utils/screen';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlanRecord {
  id: string;
  gmt_create: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  cycle: 'day' | 'week' | 'month' | 'year' | 'no';
  times: number;
  gmt_create: string;
  gmt_modified: string;
  gmt_limit?: string;
  is_top: string;
  user_id: string;
  state: string;
  records: PlanRecord[];
  image?: string;
}

interface PlansResponse {
  active: Plan[];
  finish: Plan[];
}

// 格式化日期为 YYYY年MM月DD日
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

export default function PlanManageScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PlansResponse>({ active: [], finish: [] });
  const [loading, setLoading] = useState(false);

  // 获取所有计划
  const fetchAllPlans = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await get('/api/plans', { user_id: user.id });
      
      if (result.code === 200) {
        setPlans({
          active: result.data?.active || [],
          finish: result.data?.finish || [],
        });
      } else {
        Alert.alert('错误', result.message || '获取计划列表失败');
      }
    } catch (error: any) {
      console.error('获取计划列表失败:', error);
      Alert.alert('错误', error.message || '获取计划列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 切换置顶状态
  const handleToggleTop = async (plan: Plan) => {
    try {
      const newTopStatus = plan.is_top === 'true' ? 'false' : 'true';
      const result = await put(`/api/plans/${plan.id}`, {
        is_top: newTopStatus,
      });

      if (result.code === 200) {
        // 重新获取列表
        await fetchAllPlans();
      } else {
        throw new Error(result.message || '操作失败');
      }
    } catch (error: any) {
      console.error('切换置顶状态失败:', error);
      Alert.alert('错误', error.message || '操作失败，请重试');
    }
  };

  // 进入计划详情
  const handlePlanDetail = (plan: Plan) => {
    router.push({
      pathname: '/plan-detail',
      params: {
        planId: plan.id,
        planName: plan.name,
        planState: plan.state,
      },
    });
  };

  useEffect(() => {
    fetchAllPlans();
  }, [user?.id]);

  // 获取计划图片URL
  const getPlanImageUrl = (plan: Plan): string => {
    if (plan.image) {
      if (plan.image.startsWith('http://') || plan.image.startsWith('https://')) {
        return plan.image;
      }
      return getFullImageUrl(plan.image);
    }
    // 兜底：基于plan.id生成1-18的稳定随机数
    let hash = 0;
    for (let i = 0; i < plan.id.length; i++) {
      hash = ((hash << 5) - hash) + plan.id.charCodeAt(i);
      hash = hash & hash;
    }
    const randomNum = (Math.abs(hash) % 18) + 1;
    return `${FALLBACK_IMAGE_BASE_URL}${randomNum}.png`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-top-return.png' }}
            style={styles.backButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>管理计划</Text>
        <View style={styles.headerRight} />
      </View>

      {loading && plans.active.length === 0 && plans.finish.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          {/* 进行中区域 */}
          <Text style={styles.sectionTitle}>进行中</Text>
          <View style={styles.section}>
            {plans.active.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-error-empty.png' }}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>暂无进行中的计划</Text>
              </View>
            ) : (
              plans.active.map((plan, index) => {
                const isTop = plan.is_top === 'true';
                const cycleText = plan.cycle === 'no' ? '不重复' : `每${CYCLE_MAP[plan.cycle] || plan.cycle} ${plan.times}次`;
                const deadlineText = plan.gmt_limit ? `截止 ${formatDate(plan.gmt_limit)}` : null;
                
                return (
                  <View key={plan.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.planItem}
                      onPress={() => handlePlanDetail(plan)}
                      activeOpacity={0.7}
                    >
                      {/* 左侧图片 */}
                      <Image
                        source={{ uri: getPlanImageUrl(plan) }}
                        style={styles.planImage}
                        resizeMode="cover"
                      />
                      
                      {/* 左侧信息区域 */}
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planCycle}>{cycleText}</Text>
                        {deadlineText && (
                          <Text style={styles.planDeadline}>{deadlineText}</Text>
                        )}
                      </View>
                      
                      {/* 右侧置顶操作区 */}
                      <View style={styles.topActionContainer}>
                        <View style={styles.topActionDivider} />
                        <TouchableOpacity
                          style={styles.topAction}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleTop(plan);
                          }}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: isTop ? PIN_IMAGE_URL : PIN_NORMAL_IMAGE_URL }}
                            style={styles.pinIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.topActionText}>
                            {isTop ? '取消置顶' : '置顶'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* 已结束区域 */}
          <Text style={styles.sectionTitle}>已结束</Text>
          <View style={styles.section}>
            {plans.finish.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-error-empty.png' }}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>暂无已结束的计划</Text>
              </View>
            ) : (
              plans.finish.map((plan, index) => {
                const cycleText = plan.cycle === 'no' ? '不重复' : `每${CYCLE_MAP[plan.cycle] || plan.cycle} ${plan.times}次`;
                const deadlineText = plan.gmt_limit ? `截止 ${formatDate(plan.gmt_limit)}` : null;
                
                return (
                  <View key={plan.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.planItem}
                      onPress={() => handlePlanDetail(plan)}
                      activeOpacity={0.7}
                    >
                      {/* 左侧图片 */}
                      <Image
                        source={{ uri: getPlanImageUrl(plan) }}
                        style={styles.planImage}
                        resizeMode="cover"
                      />
                      
                      {/* 左侧信息区域 */}
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planCycle}>{cycleText}</Text>
                        {deadlineText && (
                          <Text style={styles.planDeadline}>{deadlineText}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F1F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
  },
  backButton: {
    width: scaleSize(40),
    height: scaleSize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonIcon: {
    width: scaleSize(40),
    height: scaleSize(40),
  },
  headerTitle: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: '#222',
  },
  headerRight: {
    width: scaleSize(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: scaleSize(16),
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(12),
    paddingVertical: scaleSize(12),
    marginBottom: scaleSize(16),
  },
  sectionTitle: {
    fontSize: scaleSize(20),
    fontWeight: '600',
    color: '#222222',
    lineHeight: scaleSize(28),
    marginBottom: scaleSize(12),
  },
  emptyContainer: {
    paddingVertical: scaleSize(24),
    alignItems: 'center',
  },
  emptyImage: {
    width: scaleSize(60),
    height: scaleSize(60),
    marginBottom: scaleSize(12),
  },
  emptyText: {
    fontSize: scaleSize(14),
    color: '#999999',
    lineHeight: scaleSize(22),
  },
  divider: {
    height: 0.5,
    backgroundColor: '#EEEEEE',
    marginHorizontal: scaleSize(16),
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: scaleSize(16),
    paddingVertical: scaleSize(12),
  },
  planImage: {
    width: scaleSize(60),
    height: scaleSize(60),
    borderRadius: scaleSize(8),
    backgroundColor: '#F5F5F5',
    marginRight: scaleSize(12),
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: scaleSize(14),
    lineHeight: scaleSize(22),
    fontWeight: '600',
    color: '#222',
    marginBottom: scaleSize(2),
  },
  planCycle: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: '#666',
    marginBottom: scaleSize(2),
  },
  planDeadline: {
    fontSize: scaleSize(12),
    lineHeight: scaleSize(18),
    color: '#666',
  },
  topActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topActionDivider: {
    width: scaleSize(1),
    height: scaleSize(40),
    backgroundColor: '#EEEEEE',
    marginRight: scaleSize(12),
  },
  topAction: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(50),
    paddingVertical: scaleSize(4),
  },
  pinIcon: {
    width: scaleSize(18),
    height: scaleSize(18),
    marginBottom: scaleSize(6),
  },
  topActionText: {
    fontSize: scaleSize(12),
    color: '#666',
  },
});

