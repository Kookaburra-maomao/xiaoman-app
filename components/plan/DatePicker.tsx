/**
 * 日期选择器组件（自定义滚轮选择器，支持年-月-日顺序和中文月份）
 */

import { Colors } from '@/constants/theme';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useEffect, useRef, useState } from 'react';
import { Appearance, FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DatePickerProps {
  visible: boolean;
  selectedDate: string;
  onConfirm: (date: string) => void;
  onCancel: () => void;
  minDate?: Date; // 最小可选日期
}

function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 生成年份列表（当前年份前后各10年）
function generateYears(currentYear: number): number[] {
  const years: number[] = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
}

// 生成月份列表（1-12月）
function generateMonths(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));
}

// 生成日期列表（根据年月动态计算天数）
function generateDays(year: number, month: number): number[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

const ITEM_HEIGHT = 40;

export default function DatePicker({ visible, selectedDate, onConfirm, onCancel, minDate }: DatePickerProps) {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1);
  const [day, setDay] = useState(initialDate.getDate());
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  const yearListRef = useRef<FlatList>(null);
  const monthListRef = useRef<FlatList>(null);
  const dayListRef = useRef<FlatList>(null);

  // 监听主题变化
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (visible) {
      const date = selectedDate ? new Date(selectedDate) : new Date();
      setYear(date.getFullYear());
      setMonth(date.getMonth() + 1);
      setDay(date.getDate());
    }
  }, [visible, selectedDate]);

  // 当年份或月份变化时，检查日期是否有效
  useEffect(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) {
      setDay(daysInMonth);
    }
  }, [year, month]);

  // 滚动到选中的项
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        const years = generateYears(new Date().getFullYear());
        const yearIndex = years.findIndex((y) => y === year);
        if (yearIndex !== -1 && yearListRef.current) {
          yearListRef.current.scrollToIndex({ index: yearIndex, animated: false });
        }

        if (monthListRef.current) {
          monthListRef.current.scrollToIndex({ index: month - 1, animated: false });
        }

        if (dayListRef.current) {
          dayListRef.current.scrollToIndex({ index: day - 1, animated: false });
        }
      }, 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    const date = new Date(year, month - 1, day);
    onConfirm(formatDateToYYYYMMDD(date));
  };

  // Android：在 visible 为 true 时打开系统日期选择对话框（只打开一次）
  useEffect(() => {
    if (Platform.OS === 'android' && visible) {
      DateTimePickerAndroid.open({
        value: selectedDate ? new Date(selectedDate) : new Date(),
        mode: 'date',
        display: 'default',
        minimumDate: minDate,
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

  // iOS：Modal + 自定义滚轮选择器
  if (!visible) return null;

  const years = generateYears(new Date().getFullYear());
  const months = generateMonths();
  const days = generateDays(year, month);

  const renderYearItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={styles.pickerItem}
      onPress={() => setYear(item)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.pickerItemText,
        isDark && styles.pickerItemTextDark,
        year === item && styles.pickerItemTextSelected,
        year === item && isDark && styles.pickerItemTextSelectedDark,
      ]}>
        {item}年
      </Text>
    </TouchableOpacity>
  );

  const renderMonthItem = ({ item }: { item: { value: number; label: string } }) => (
    <TouchableOpacity
      style={styles.pickerItem}
      onPress={() => setMonth(item.value)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.pickerItemText,
        isDark && styles.pickerItemTextDark,
        month === item.value && styles.pickerItemTextSelected,
        month === item.value && isDark && styles.pickerItemTextSelectedDark,
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderDayItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={styles.pickerItem}
      onPress={() => setDay(item)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.pickerItemText,
        isDark && styles.pickerItemTextDark,
        day === item && styles.pickerItemTextSelected,
        day === item && isDark && styles.pickerItemTextSelectedDark,
      ]}>
        {item}日
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent visible={visible} animationType="slide">
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      />
      <View style={[
        styles.datePickerContainer,
        isDark && styles.datePickerContainerDark
      ]}>
        <View style={[
          styles.datePickerHeader,
          isDark && styles.datePickerHeaderDark
        ]}>
          <TouchableOpacity onPress={onCancel} style={styles.datePickerButton}>
            <Text style={[
              styles.datePickerCancelText,
              isDark && styles.datePickerCancelTextDark
            ]}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleConfirm} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>确定</Text>
          </TouchableOpacity>
        </View>

        {/* 自定义滚轮选择器 */}
        <View style={styles.pickerContainer}>
          {/* 选中指示器 */}
          <View style={[
            styles.selectionIndicator,
            isDark && styles.selectionIndicatorDark
          ]} />

          {/* 年份选择器 */}
          <View style={styles.pickerColumn}>
            <FlatList
              ref={yearListRef}
              data={years}
              renderItem={renderYearItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={styles.listContent}
            />
          </View>

          {/* 月份选择器 */}
          <View style={styles.pickerColumn}>
            <FlatList
              ref={monthListRef}
              data={months}
              renderItem={renderMonthItem}
              keyExtractor={(item) => item.value.toString()}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={styles.listContent}
            />
          </View>

          {/* 日期选择器 */}
          <View style={styles.pickerColumn}>
            <FlatList
              ref={dayListRef}
              data={days}
              renderItem={renderDayItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
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
  datePickerContainerDark: {
    backgroundColor: '#1C1C1E',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  datePickerHeaderDark: {
    borderBottomColor: '#38383A',
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
  datePickerCancelTextDark: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    flexDirection: 'row',
    height: 200,
    paddingHorizontal: 16,
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 80,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    zIndex: 1,
    pointerEvents: 'none',
  },
  selectionIndicatorDark: {
    borderColor: '#38383A',
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  listContent: {
    paddingVertical: 80,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#999999',
  },
  pickerItemTextDark: {
    color: '#8E8E93',
  },
  pickerItemTextSelected: {
    fontSize: 20,
    color: Colors.light.text,
    fontWeight: '600',
  },
  pickerItemTextSelectedDark: {
    color: '#FFFFFF', // 暗黑模式下选中项为白色
  },
});
