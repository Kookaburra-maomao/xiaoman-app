/**
 * 创建计划弹窗组件
 */

import { CYCLE_MAP } from '@/constants/plan';
import { Colors } from '@/constants/theme';
import { CreatePlanForm } from '@/types/plan';
import { formatDateForDisplay } from '@/utils/date-utils';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DatePicker from './DatePicker';

interface PlanCreateModalProps {
  visible: boolean;
  formData: CreatePlanForm;
  loading: boolean;
  showDatePicker: boolean;
  onClose: () => void;
  onFormChange: (formData: CreatePlanForm) => void;
  onShowDatePicker: () => void;
  onConfirmDate: (date: string) => void;
  onCancelDate: () => void;
  onSubmit: () => void;
}

export default function PlanCreateModal({
  visible,
  formData,
  loading,
  showDatePicker,
  onClose,
  onFormChange,
  onShowDatePicker,
  onConfirmDate,
  onCancelDate,
  onSubmit,
}: PlanCreateModalProps) {
  // 切换周期选项
  const handleCycleToggle = () => {
    const cycles: Array<'day' | 'week' | 'month' | 'year'> = ['day', 'week', 'month', 'year'];
    const currentIndex = cycles.indexOf(formData.cycle as any);
    const nextIndex = (currentIndex + 1) % cycles.length;
    onFormChange({ ...formData, cycle: cycles[nextIndex] });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.createModalOverlay}>
        <View style={styles.createModalContent}>
          {/* 标题 */}
          <View style={styles.createModalHeader}>
            <Text style={styles.createModalTitle}>创建计划</Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.createModalBody} showsVerticalScrollIndicator={false}>
            {/* 计划标题 */}
            <View style={styles.formItem}>
              <TextInput
                style={styles.formInput}
                placeholder="请输入计划标题"
                placeholderTextColor={Colors.light.icon}
                value={formData.name}
                onChangeText={(text) => onFormChange({ ...formData, name: text })}
              />
            </View>

            {/* 计划是否重复 */}
            <View style={styles.formItem}>
              <View style={styles.repeatRow}>
                {/* 不重复选项 */}
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => onFormChange({ ...formData, cycle: 'no', times: 0 })}
                  activeOpacity={0.7}
                >
                  <View style={styles.radioButton}>
                    {formData.cycle === 'no' && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.radioLabel}>不重复</Text>
                </TouchableOpacity>

                {/* 重复选项 */}
                {formData.cycle !== 'no' && (
                  <>
                    <View style={styles.selectBox}>
                      <TouchableOpacity
                        style={styles.selectButton}
                        onPress={handleCycleToggle}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.selectButtonText}>
                          {CYCLE_MAP[formData.cycle] || formData.cycle}
                        </Text>
                        <Image source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-plan-sort.png' }} style={styles.sortIcon} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.repeatText}>至少完成</Text>
                    <TextInput
                      style={[styles.formInput, styles.timesInput]}
                      placeholder="1"
                      placeholderTextColor={Colors.light.icon}
                      value={formData.times.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 1;
                        onFormChange({ ...formData, times: num });
                      }}
                      keyboardType="number-pad"
                    />
                    <Text style={styles.repeatText}>次</Text>
                  </>
                )}

                {/* 重复选项按钮 */}
                {formData.cycle === 'no' && (
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => onFormChange({ ...formData, cycle: 'day', times: 1 })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioButton}>
                      {formData.cycle !== 'no' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={styles.radioLabel}>重复</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 计划截止日期 */}
            <View style={styles.formItem}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={onShowDatePicker}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateInputText, !formData.gmt_limit && styles.dateInputPlaceholder]}>
                  {formData.gmt_limit ? formatDateForDisplay(formData.gmt_limit) : '请选择截止日期'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.light.icon} />
              </TouchableOpacity>
              
              {/* 自定义日期选择器 */}
              <DatePicker
                visible={showDatePicker}
                selectedDate={formData.gmt_limit}
                onConfirm={onConfirmDate}
                onCancel={onCancelDate}
              />
            </View>
          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.createModalFooter}>
            <TouchableOpacity
              style={[styles.createModalButton, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createModalButton, styles.confirmButton]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>完成创建</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  createModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  createModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  createModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  createModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  createModalBody: {
    maxHeight: 500,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formItem: {
    marginBottom: 20,
  },
  formInput: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.tint,
  },
  radioLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  repeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectBox: {
    minWidth: 80,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  repeatText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  timesInput: {
    width: 60,
    textAlign: 'center',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  dateInputText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dateInputPlaceholder: {
    color: Colors.light.icon,
  },
  createModalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  createModalButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  confirmButton: {
    backgroundColor: Colors.light.tint,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortIcon: {
    width: scaleSize(16),
    height: scaleSize(16),
  },
});

