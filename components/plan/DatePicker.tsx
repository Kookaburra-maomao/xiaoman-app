/**
 * 日期选择器组件（使用 @react-native-community/datetimepicker，兼容 New Architecture）
 */

import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

interface DatePickerProps {
  visible: boolean;
  selectedDate: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DatePicker({ visible, selectedDate, onConfirm, onCancel }: DatePickerProps) {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [value, setValue] = useState<Date>(initialDate);

  useEffect(() => {
    if (visible) {
      setValue(selectedDate ? new Date(selectedDate) : new Date());
    }
  }, [visible, selectedDate]);

  const handleConfirm = () => {
    onConfirm(formatDateToYYYYMMDD(value));
  };

  // Android：在 visible 为 true 时打开系统日期选择对话框（只打开一次）
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      DateTimePickerAndroid.open({
        value: selectedDate ? new Date(selectedDate) : new Date(),
        mode: 'date',
        display: 'default',
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            onConfirm(formatDateToYYYYMMDD(date));
          }
          onCancel();
        },
      });
    }
  }, [visible]);

  if (Platform.OS === 'android') {
    return null;
  }

  // iOS：Modal + 内联选择器
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      />
      <View style={styles.datePickerContainer}>
        <View style={styles.datePickerHeader}>
          <TouchableOpacity onPress={onCancel} style={styles.datePickerButton}>
            <Text style={styles.datePickerCancelText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConfirm} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>确定</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={value}
          mode="date"
          display="spinner"
          onChange={(_, date) => date && setValue(date)}
          style={styles.picker}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  datePickerButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
  },
  datePickerCancelText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  picker: {
    height: 200,
  },
});
