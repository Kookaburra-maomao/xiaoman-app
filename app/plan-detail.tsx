import PlanEditModal, { EditPlanFormData } from '@/components/plan/PlanEditModal';
import { CYCLE_MAP } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import {
    FALLBACK_IMAGE_BASE_URL,
    ICON_CALC_URL,
    ICON_OK_URL,
    ICON_REPEAT_URL,
    ICON_RETURN_URL,
    ICON_WARNING_URL,
    MISSION_COMPLETED_ICON_URL,
    OPTION_ICON_URL
} from '@/constants/urls';
import { getPlanKeepTimesList } from '@/utils/plan-utils';
import { del, get, put } from '@/utils/request';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_ASPECT_RATIO = 295 / 360;
const IMAGE_WIDTH = SCREEN_WIDTH - 80; // 左右各16px边距
const IMAGE_HEIGHT = IMAGE_WIDTH / IMAGE_ASPECT_RATIO;

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

export default function PlanDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const planId = params.planId as string;
  const initialPlanState = params.planState as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 判断是否可以编辑（已完成计划不可编辑）
  const canEdit = plan?.state !== 'finish' && initialPlanState !== 'finish';

  // 获取计划详情
  const fetchPlanDetail = async () => {
    if (!planId) return;

    try {
      setLoading(true);
      const result = await get(`/api/plans/${planId}`);
      
      if (result.code === 200) {
        const planData = result.data;
        setPlan(planData);
      } else {
        Alert.alert('错误', result.message || '获取计划详情失败');
      }
    } catch (error: any) {
      console.error('获取计划详情失败:', error);
      Alert.alert('错误', error.message || '获取计划详情失败，请重试');
    } finally {
      setLoading(false);
    }
  };


  // 删除计划
  const handleDeletePlan = () => {
    setShowDeleteMenu(false); // 先关闭菜单
    Alert.alert(
      '确认删除',
      '确定要删除这个计划吗？删除后将无法恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await del(`/api/plans/${planId}`);
              
              if (result.code === 200) {
                Alert.alert('成功', '计划已删除', [
                  {
                    text: '确定',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                throw new Error(result.message || '删除失败');
              }
            } catch (error: any) {
              console.error('删除计划失败:', error);
              Alert.alert('错误', error.message || '删除失败，请重试');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 完成任务
  const handleFinishPlan = () => {
    Alert.alert(
      '确认完成',
      '确定要将此计划标记为已完成吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await put(`/api/plans/${planId}`, {
                state: 'finish',
              });
              
              if (result.code === 200) {
                Alert.alert('成功', '计划已标记为完成', [
                  {
                    text: '确定',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                throw new Error(result.message || '操作失败');
              }
            } catch (error: any) {
              console.error('完成任务失败:', error);
              Alert.alert('错误', error.message || '操作失败，请重试');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 取消完成计划
  const handleCancelFinishPlan = () => {
    Alert.alert(
      '确认取消完成',
      '确定要将此计划标记为未完成吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await put(`/api/plans/${planId}`, {
                state: 'activing',
              });
              
              if (result.code === 200) {
                Alert.alert('成功', '计划已标记为未完成', [
                  {
                    text: '确定',
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                throw new Error(result.message || '操作失败');
              }
            } catch (error: any) {
              console.error('取消完成失败:', error);
              Alert.alert('错误', error.message || '操作失败，请重试');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchPlanDetail();
  }, [planId]);

  // 保存编辑计划
  const handleSaveEditPlan = async (formData: EditPlanFormData) => {
    if (!plan) return;

    const timesNum = formData.cycle === 'no' ? 0 : formData.times;
    try {
      setSaving(true);
      const result = await put(`/api/plans/${plan.id}`, {
        name: formData.name.trim(),
        description: '', // 始终传空字符串
        cycle: formData.cycle,
        times: timesNum,
        gmt_limit: formData.gmt_limit || '',
      });

      if (result.code === 200) {
        Alert.alert('成功', '修改已保存');
        setShowEditModal(false);
        // 重新获取详情以更新记录
        await fetchPlanDetail();
      } else {
        throw new Error(result.message || '保存失败');
      }
    } catch (error: any) {
      console.error('保存修改失败:', error);
      Alert.alert('错误', error.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 获取计划图片URL（必须在早期返回之前调用，遵守 Hooks 规则）
  const planImageUrl = useMemo(() => {
    if (!plan) return '';
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
  }, [plan?.id, plan?.image]);

  // 格式化日期为 YYYY年MM月DD日
  const formatDateFull = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  if (loading && !plan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar hidden />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image
              source={{ uri: ICON_RETURN_URL }}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.optionButton}>
              <Image
                source={{ uri: OPTION_ICON_URL }}
                style={styles.optionIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar hidden />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image
              source={{ uri: ICON_RETURN_URL }}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.optionButton}>
              <Image
                source={{ uri: OPTION_ICON_URL }}
                style={styles.optionIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>计划不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  const planKeepTimesList = getPlanKeepTimesList(plan);
  const isFinished = plan.state === 'finish';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar hidden />
      
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image
            source={{ uri: ICON_RETURN_URL }}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowDeleteMenu(!showDeleteMenu)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: OPTION_ICON_URL }}
              style={styles.optionIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          {/* 选项气泡菜单 */}
          {showDeleteMenu && (
            <View style={styles.deleteMenuBubble}>
              <TouchableOpacity
                style={styles.deleteMenuItem}
                onPress={() => {
                  setShowDeleteMenu(false);
                  setShowEditModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color="#222" />
                <Text style={styles.deleteMenuText}>编辑计划</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.deleteMenuItem}
                onPress={handleDeletePlan}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color="#222" />
                <Text style={styles.deleteMenuText}>删除计划</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* 点击外部关闭菜单 */}
      {showDeleteMenu && (
        <TouchableWithoutFeedback onPress={() => setShowDeleteMenu(false)}>
          <View style={styles.menuOverlay} />
        </TouchableWithoutFeedback>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* 计划图片 */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: planImageUrl }}
            style={styles.planImage}
            resizeMode="cover"
          />
          
          {/* 渐变遮罩 */}
          <LinearGradient
            colors={['rgba(0, 0, 0, 0)', '#000000']}
            locations={[0, 1]}
            style={styles.imageGradient}
          >
            <Text style={styles.planNameOverlay}>{plan.name}</Text>
          </LinearGradient>
        </View>
        {/* 完成图标 */}
        {isFinished && (
          <Image
            source={{ uri: MISSION_COMPLETED_ICON_URL }}
            style={styles.completedIcon}
            resizeMode="contain"
          />
        )}
        {/* 信息区域 */}
        <View style={styles.infoSection}>
          {/* 第一行：是否重复和周期目标次数 */}
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Image
                source={{ uri: ICON_REPEAT_URL }}
                style={styles.infoIcon}
                resizeMode="contain"
              />
              <Text style={styles.infoText}>
                {plan.cycle === 'no' ? '不重复' : '重复'}
              </Text>
            </View>
            {plan.cycle !== 'no' && (
              <Text style={styles.infoTextRight}>
                每{CYCLE_MAP[plan.cycle] || plan.cycle} {plan.times}次
              </Text>
            )}
          </View>

          {/* 第二行：截止日期 */}
          {plan.gmt_limit && (
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Image
                  source={{ uri: ICON_CALC_URL }}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
                <Text style={styles.infoText}>截止日期</Text>
              </View>
              <Text style={styles.infoTextRight}>{formatDateFull(plan.gmt_limit)}</Text>
            </View>
          )}
        </View>


        {/* 完成记录 */}
        <View style={styles.recordsSection}>
          <Text style={styles.recordsTitle}>完成记录</Text>
          <View style={styles.recordsCard}>
            {plan.cycle === 'no' && plan.state === 'finish' ? (
              // 不重复计划且已完成，显示完成日期
              <View style={styles.recordItem}>
                <View style={styles.recordLeft}>
                  <Image
                    source={{ uri: ICON_OK_URL }}
                    style={styles.recordStatusIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.recordPeriod}>{formatDateFull(plan.gmt_modified)}</Text>
                </View>
                <Text style={styles.recordCount}>1/1</Text>
              </View>
            ) : planKeepTimesList.length === 0 ? (
              <View style={styles.emptyRecords}>
                <Text style={styles.emptyRecordsText}>暂无完成记录</Text>
              </View>
            ) : (
              planKeepTimesList.map((item, index) => {
                const isCompleted = item.times >= plan.times;
                return (
                  <View key={index}>
                    {index > 0 && <View style={styles.recordDivider} />}
                    <View style={styles.recordItem}>
                      <View style={styles.recordLeft}>
                        <Image
                          source={{ uri: isCompleted ? ICON_OK_URL : ICON_WARNING_URL }}
                          style={styles.recordStatusIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.recordPeriod}>{item.key}</Text>
                      </View>
                      <Text style={styles.recordCount}>
                        {item.times}/{plan.times}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomButtons}>
        {plan.state === 'finish' ? (
          <></>
        ) : (
          <TouchableOpacity
            style={[styles.bottomButton, styles.finishButton]}
            onPress={handleFinishPlan}
            disabled={loading || saving}
          >
            <Text style={styles.finishButtonText}>完成计划</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 编辑计划抽屉 */}
      <PlanEditModal
        visible={showEditModal}
        plan={plan}
        planImageUrl={planImageUrl}
        saving={saving}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEditPlan}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 60,
    height: '100%',
  },
  headerRight: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 60,
    height: 60,
  },
  deleteMenuBubble: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  deleteMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  deleteMenuText: {
    fontSize: 16,
    color: '#222',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 16,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 24,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden'
  },
  planImage: {
    width: '100%',
    height: '100%',
  },
  completedIcon: {
    position: 'absolute',
    top: 0,
    right: 6,
    width: 98,
    height: 100,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planNameOverlay: {
    fontFamily: 'PingFang SC',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 36,
    color: '#FFFFFF',
  },
  infoSection: {
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    width: 16,
    height: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#222',
  },
  infoTextRight: {
    fontSize: 16,
    color: '#666',
  },
  nameContainer: {
    marginBottom: 16,
  },
  nameDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  nameText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  editButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    padding: 0,
  },
  cycleContainer: {
    marginBottom: 24,
  },
  cycleDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleText: {
    fontSize: 16,
    color: '#666',
  },
  cycleEditButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cycleEditContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cycleEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cycleLabel: {
    fontSize: 16,
    color: '#222',
    minWidth: 80,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  modalConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalConfirmText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  modalPicker: {
    height: 200,
  },
  timesInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minWidth: 80,
  },
  recordsSection: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  recordsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyRecords: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRecordsText: {
    fontSize: 14,
    color: '#999',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  recordDivider: {
    height: 0.5,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordStatusIcon: {
    width: 16,
    height: 16,
  },
  recordPeriod: {
    fontSize: 16,
    color: '#222',
  },
  recordCount: {
    fontSize: 16,
    color: '#666',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#FF4444',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finishButton: {
    width: 335,
    height: 50,
    backgroundColor: '#000000',
    borderRadius: 14,

    opacity: 1,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelFinishButton: {
    backgroundColor: '#FFA500',
  },
  cancelFinishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 8,
  },
});
