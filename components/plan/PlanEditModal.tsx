/**
 * 编辑计划抽屉组件
 */

import { CYCLE_MAP } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import { formatDateForDisplay } from '@/utils/date-utils';
import { get } from '@/utils/request';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import DatePicker from './DatePicker';

export interface EditPlanFormData {
  name: string;
  description: string;
  cycle: 'day' | 'week' | 'month' | 'year' | 'no';
  times: number;
  gmt_limit: string;
  image?: string;
  image_preview?: string;
}

interface PlanEditModalProps {
  visible: boolean;
  plan: {
    id: string;
    name: string;
    description: string;
    cycle: 'day' | 'week' | 'month' | 'year' | 'no';
    times: number;
    gmt_limit?: string;
    image?: string;
  } | null;
  planImageUrl?: string; // 可选，创建模式时可能没有
  saving: boolean;
  onClose: () => void;
  onSave: (formData: EditPlanFormData) => Promise<void>;
}

export default function PlanEditModal({
  visible,
  plan,
  planImageUrl,
  saving,
  onClose,
  onSave,
}: PlanEditModalProps) {
  const [editFormData, setEditFormData] = useState<EditPlanFormData>({
    name: '',
    description: '',
    cycle: 'no',
    times: 1,
    gmt_limit: '',
    image: undefined,
    image_preview: undefined,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCycleMenu, setShowCycleMenu] = useState(false);
  const [isFetchingTag, setIsFetchingTag] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (visible) {
      if (plan) {
        // 编辑模式：使用计划数据
        setEditFormData({
          name: plan.name || '',
          description: plan.description || '',
          cycle: plan.cycle || 'no',
          times: plan.times || 1,
          gmt_limit: plan.gmt_limit || '',
        });
      } else {
        // 创建模式：使用空表单
        setEditFormData({
          name: '',
          description: '',
          cycle: 'no',
          times: 1,
          gmt_limit: '',
          image: undefined,
          image_preview: undefined,
        });
      }
    }
  }, [plan, visible]);

  // 获取 plan_tag 并生成图片 URL（在保存前调用）
  const fetchPlanTagAndImage = async (planName: string): Promise<{ image?: string; image_preview?: string }> => {
    // 只在创建模式（plan 为 null）且计划名称不为空时调用
    if (plan || !planName.trim()) {
      return {};
    }

    try {
      setIsFetchingTag(true);
      const result = await get('/api/chat/plan-to-tag', {
        plan: planName.trim(),
      });

      if (result.code === 200 && result.data?.plan_tag) {
        const planTag = result.data.plan_tag;
        // 生成 1-5 的随机数
        const randomIndex = Math.floor(Math.random() * 5) + 1;
        
        // 生成 image 和 image_preview URL
        const image = getPlanImageUrl(planTag, randomIndex);
        const image_preview = getPlanImagePreviewUrl(planTag, randomIndex);
        
        // 更新表单数据
        setEditFormData((prev) => ({
          ...prev,
          image,
          image_preview,
        }));
        
        return { image, image_preview };
      }
    } catch (error) {
      console.error('获取计划 tag 失败:', error);
      // 静默处理错误，不影响用户操作
    } finally {
      setIsFetchingTag(false);
    }
    
    return {};
  };

  // 处理保存
  const handleSave = async () => {
    if (!editFormData.name.trim()) {
      Alert.alert('提示', '计划名称不能为空');
      return;
    }
    
    // 在保存前，获取 plan_tag 并生成图片 URL（仅创建模式）
    const imageData = await fetchPlanTagAndImage(editFormData.name);
    
    // 确保 description 始终为空字符串，并使用获取到的图片数据
    const formDataToSave = {
      ...editFormData,
      description: '',
      // 如果获取到了图片数据，使用它们；否则使用已有的
      image: imageData.image || editFormData.image,
      image_preview: imageData.image_preview || editFormData.image_preview,
    };

    const timesNum = formDataToSave.cycle === 'no' ? 0 : formDataToSave.times;
    if (formDataToSave.cycle !== 'no' && (isNaN(timesNum) || timesNum < 1)) {
      Alert.alert('提示', '次数必须大于0');
      return;
    }

    await onSave(formDataToSave);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.editModalBackdrop} />
        </TouchableWithoutFeedback>
        <View style={styles.editModalContent}>
          {/* 头部 */}
          <View style={styles.editModalHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.editModalCloseButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#222" />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>{plan ? '编辑计划' : '新建计划'}</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.editModalSaveButton}
              activeOpacity={0.7}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
            {/* 计划名称 */}
            <View style={styles.editFormItem}>
              <View style={styles.editFormItemRow}>
                <View style={styles.editFormItemLeft}>
                  
                  <TextInput
                    style={styles.editFormInput}
                    placeholder={plan ? '计划名称' : '输入你的计划...'}
                    placeholderTextColor={Colors.light.icon}
                    value={editFormData.name}
                    onChangeText={(text) => setEditFormData({ ...editFormData, name: text })}
                  />
                </View>
              </View>
            </View>

            {/* 分隔线 */}
            <View style={styles.editFormDivider} />
            {/* 重复 */}
            <View style={styles.editFormItem}>
              <View style={styles.editFormItemRow}>
                <View style={styles.editFormItemLeft}>
                  <Ionicons name="repeat-outline" size={20} color={Colors.light.text} />
                  <Text style={styles.editFormLabel}>重复</Text>
                </View>
                <View style={styles.editFormSelectContainer}>
                  <TouchableOpacity
                    style={styles.editFormSelect}
                    onPress={() => setShowCycleMenu(!showCycleMenu)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editFormSelectText}>
                      {editFormData.cycle === 'no' ? '不重复' : CYCLE_MAP[editFormData.cycle]}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.light.icon} />
                  </TouchableOpacity>
                  {/* 重复选择气泡菜单 */}
                  {showCycleMenu && (
                    <View style={styles.cycleMenuBubble}>
                      <TouchableOpacity
                        style={styles.cycleMenuItem}
                        onPress={() => {
                          console.log('不重复');
                          setEditFormData({ ...editFormData, cycle: 'no' });
                          setShowCycleMenu(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cycleMenuText}>不重复</Text>
                        {editFormData.cycle === 'no' && (
                          <Ionicons name="checkmark" size={18} color="#222" />
                        )}
                      </TouchableOpacity>
                      <View style={styles.cycleMenuDivider} />
                      <TouchableOpacity
                        style={styles.cycleMenuItem}
                        onPress={() => {
                          console.log('day');
                          setEditFormData({ ...editFormData, cycle: 'day' });
                          setShowCycleMenu(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cycleMenuText}>每天</Text>
                        {editFormData.cycle === 'day' && (
                          <Ionicons name="checkmark" size={18} color="#222" />
                        )}
                      </TouchableOpacity>
                      <View style={styles.cycleMenuDivider} />
                      <TouchableOpacity
                        style={styles.cycleMenuItem}
                        onPress={() => {
                          setEditFormData({ ...editFormData, cycle: 'week' });
                          setShowCycleMenu(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cycleMenuText}>每周</Text>
                        {editFormData.cycle === 'week' && (
                          <Ionicons name="checkmark" size={18} color="#222" />
                        )}
                      </TouchableOpacity>
                      <View style={styles.cycleMenuDivider} />
                      <TouchableOpacity
                        style={styles.cycleMenuItem}
                        onPress={() => {
                          setEditFormData({ ...editFormData, cycle: 'month' });
                          setShowCycleMenu(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cycleMenuText}>每月</Text>
                        {editFormData.cycle === 'month' && (
                          <Ionicons name="checkmark" size={18} color="#222" />
                        )}
                      </TouchableOpacity>
                      <View style={styles.cycleMenuDivider} />
                      <TouchableOpacity
                        style={styles.cycleMenuItem}
                        onPress={() => {
                          setEditFormData({ ...editFormData, cycle: 'year' });
                          setShowCycleMenu(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cycleMenuText}>每年</Text>
                        {editFormData.cycle === 'year' && (
                          <Ionicons name="checkmark" size={18} color="#222" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 分隔线 */}
            {editFormData.cycle !== 'no' && <View style={styles.editFormDivider} />}

            {/* 次数 */}
            {editFormData.cycle !== 'no' && (
              <View style={styles.editFormItem}>
                <View style={styles.editFormItemRow}>
                  <View style={styles.editFormItemLeft}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.light.text} />
                    <Text style={styles.editFormLabel}>次数</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editFormSelect}
                    onPress={() => {
                      // 显示次数选择器
                      Alert.prompt(
                        '选择次数',
                        '请输入1-10之间的数字',
                        [
                          { text: '取消', style: 'cancel' },
                          {
                            text: '确定',
                            onPress: (value: string | undefined) => {
                              const times = parseInt(value || '1', 10);
                              if (times >= 1 && times <= 10) {
                                setEditFormData({ ...editFormData, times });
                              }
                            },
                          },
                        ],
                        'plain-text',
                        editFormData.times.toString()
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editFormSelectText}>{editFormData.times}次</Text>
                    <Ionicons name="chevron-down" size={18} color={Colors.light.icon} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 分隔线 */}
            <View style={styles.editFormDivider} />

            {/* 截止日期 */}
            <View style={styles.editFormItem}>
              <View style={styles.editFormItemRow}>
                <View style={styles.editFormItemLeft}>
                  <Ionicons name="calendar-outline" size={20} color={Colors.light.text} />
                  <Text style={styles.editFormLabel}>截止日期</Text>
                </View>
                <TouchableOpacity
                  style={styles.editFormSelect}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.editFormSelectText, !editFormData.gmt_limit && styles.editFormSelectPlaceholder]}>
                    {editFormData.gmt_limit ? formatDateForDisplay(editFormData.gmt_limit) : '请选择截止日期'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={Colors.light.icon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 日期选择器 */}
            <DatePicker
              visible={showDatePicker}
              selectedDate={editFormData.gmt_limit}
              onConfirm={(date) => {
                setEditFormData({ ...editFormData, gmt_limit: date });
                setShowDatePicker(false);
              }}
              onCancel={() => setShowDatePicker(false)}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  editModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  editModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: (Platform.OS === 'ios' ? 34 : 16) + 100,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  editModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  editModalSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editModalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  editFormItem: {
    marginBottom: 16,
  },
  editFormItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  editFormItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  editPlanImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  editFormInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    padding: 0,
  },
  editFormLabel: {
    fontSize: 16,
    color: '#222',
  },
  editFormTextArea: {
    fontSize: 16,
    color: '#222',
    borderRadius: 8,
    textAlignVertical: 'top',
  },
  editFormDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 8,
  },
  editFormSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editFormSelectText: {
    fontSize: 16,
    color: '#222',
  },
  editFormSelectPlaceholder: {
    color: Colors.light.icon,
  },
  editFormSelectContainer: {
    position: 'relative',
  },
  cycleMenuBubble: {
    position: 'absolute',
    top: -80,
    right: 100,
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
    zIndex: 1001,
  },
  cycleMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cycleMenuText: {
    fontSize: 16,
    color: '#222',
  },
  cycleMenuDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 8,
  },
  cycleMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
});
