/**
 * 日期选择器组件
 */

import { Colors } from '@/constants/theme';
import { generateDays, generateMonths, generateYears, getDaysInMonth } from '@/utils/date-utils';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerProps {
  visible: boolean;
  selectedDate: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

export default function DatePicker({ visible, selectedDate, onConfirm, onCancel }: DatePickerProps) {
  if (!visible) return null;

  // 解析当前选中的日期
  const getInitialDate = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
  };

  const initialDate = getInitialDate();
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);

  // 处理年月日变化
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // 检查当前日期是否有效（例如2月29日）
    const maxDay = getDaysInMonth(year, selectedMonth);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    // 检查当前日期是否有效
    const maxDay = getDaysInMonth(selectedYear, month);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  };

  // 确认日期选择
  const handleConfirm = () => {
    const year = selectedYear;
    const month = String(selectedMonth).padStart(2, '0');
    const day = String(selectedDay).padStart(2, '0');
    onConfirm(`${year}-${month}-${day}`);
  };

  return (
    <View style={styles.datePickerContainer}>
      <View style={styles.datePickerHeader}>
        <TouchableOpacity onPress={onCancel} style={styles.datePickerButton}>
          <Text style={styles.datePickerCancelText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={styles.datePickerButton}>
          <Text style={styles.datePickerButtonText}>确定</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.customDatePicker}>
        {/* 年份选择 */}
        <View style={styles.pickerColumnYear}>
          <Picker
            selectedValue={selectedYear}
            onValueChange={handleYearChange}
            style={styles.picker}
          >
            {generateYears().map((year) => (
              <Picker.Item key={year} label={`${year}`} value={year} />
            ))}
          </Picker>
        </View>
        
        {/* 月份选择 */}
        <View style={styles.pickerColumnMonth}>
          <Picker
            selectedValue={selectedMonth}
            onValueChange={handleMonthChange}
            style={styles.picker}
          >
            {generateMonths().map((month) => (
              <Picker.Item key={month} label={`${month}`} value={month} />
            ))}
          </Picker>
        </View>
        
        {/* 日期选择 */}
        <View style={styles.pickerColumnDay}>
          <Picker
            selectedValue={selectedDay}
            onValueChange={setSelectedDay}
            style={styles.picker}
          >
            {generateDays(selectedYear, selectedMonth).map((day) => (
              <Picker.Item key={day} label={`${day}`} value={day} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  datePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
  customDatePicker: {
    flexDirection: 'row',
    height: 200,
  },
  pickerColumnYear: {
    flex: 2,
  },
  pickerColumnMonth: {
    flex: 1.2,
  },
  pickerColumnDay: {
    flex: 1.2,
  },
  picker: {
    height: 200,
  },
});

