/**
 * 自定义中文日期时间选择器
 * 从左到右：年 月 日 时 分 秒
 */

import { scaleSize } from '@/utils/screen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList, Modal, StyleSheet,
    Text, TouchableOpacity, View
} from 'react-native';

interface DateTimePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = scaleSize(44);
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const range = (start: number, end: number) => {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
};

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

// 单列选择器
function PickerColumn({ data, selected, onSelect, suffix }: {
  data: number[];
  selected: number;
  onSelect: (val: number) => void;
  suffix: string;
}) {
  const flatListRef = useRef<FlatList>(null);
  const isScrollingRef = useRef(false);
  const selectedIndex = data.indexOf(selected);

  // 初始化和外部值变化时滚动到选中项
  useEffect(() => {
    if (!isScrollingRef.current && selectedIndex >= 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedIndex, data.length]);

  const handleMomentumEnd = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, data.length - 1));
    isScrollingRef.current = false;
    if (data[clamped] !== selected) {
      onSelect(data[clamped]);
    }
  }, [data, selected, onSelect]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: { item: number }) => {
    const isSelected = item === selected;
    const label = suffix === '年'
      ? `${item}${suffix}`
      : `${String(item).padStart(2, '0')}${suffix}`;
    return (
      <View style={styles.item}>
        <Text
          style={[styles.itemText, isSelected && styles.itemTextSelected]}
          allowFontScaling={false}
        >
          {label}
        </Text>
      </View>
    );
  }, [selected, suffix]);

  return (
    <View style={styles.column}>
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => `${item}`}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={() => { isScrollingRef.current = true; }}
        onMomentumScrollEnd={handleMomentumEnd}
        contentContainerStyle={{
          paddingTop: ITEM_HEIGHT * 2,
          paddingBottom: ITEM_HEIGHT * 2,
        }}
        initialScrollIndex={selectedIndex >= 0 ? selectedIndex : 0}
      />
    </View>
  );
}

export default function DateTimePickerModal({ visible, value, onConfirm, onCancel }: DateTimePickerModalProps) {
  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth() + 1);
  const [day, setDay] = useState(value.getDate());
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());
  const [second, setSecond] = useState(0);

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();
  const nowHour = now.getHours();
  const nowMinute = now.getMinutes();
  const nowSecond = now.getSeconds();

  useEffect(() => {
    if (visible) {
      setYear(value.getFullYear());
      setMonth(value.getMonth() + 1);
      setDay(value.getDate());
      setHour(value.getHours());
      setMinute(value.getMinutes());
      setSecond(0);
    }
  }, [visible]);

  // 动态计算各列的可选范围
  const isCurrentYear = year === nowYear;
  const isCurrentMonth = isCurrentYear && month === nowMonth;
  const isCurrentDay = isCurrentMonth && day === nowDay;
  const isCurrentHour = isCurrentDay && hour === nowHour;
  const isCurrentMinute = isCurrentHour && minute === nowMinute;

  const maxMonth = isCurrentYear ? nowMonth : 12;
  const monthInRange = getDaysInMonth(year, month);
  const maxDayByDate = isCurrentMonth ? nowDay : monthInRange;
  const maxDay = Math.min(monthInRange, maxDayByDate);
  const safeDay = Math.min(day, maxDay);

  const maxHour = isCurrentDay ? nowHour : 23;
  const maxMinute = isCurrentHour ? nowMinute : 59;

  // 当上级范围变化时，自动修正下级值
  useEffect(() => {
    if (month > maxMonth) setMonth(maxMonth);
  }, [year]);

  useEffect(() => {
    if (day > maxDay) setDay(maxDay);
  }, [year, month]);

  useEffect(() => {
    if (hour > maxHour) setHour(maxHour);
  }, [year, month, day]);

  useEffect(() => {
    if (minute > maxMinute) setMinute(maxMinute);
  }, [year, month, day, hour]);

  const handleConfirm = () => {
    const selected = new Date(year, month - 1, safeDay, hour, minute, 0);
    // 最终校验：不能超过当前时间
    if (selected.getTime() > now.getTime()) {
      onConfirm(now);
    } else {
      onConfirm(selected);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <View />
      </TouchableOpacity>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Text style={styles.cancelText} allowFontScaling={false}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title} allowFontScaling={false}>选择日期时间</Text>
          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.7}>
            <Text style={styles.confirmText} allowFontScaling={false}>确定</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.pickerRow}>
          <PickerColumn data={range(2020, nowYear)} selected={year} onSelect={setYear} suffix="年" />
          <PickerColumn data={range(1, maxMonth)} selected={Math.min(month, maxMonth)} onSelect={setMonth} suffix="月" />
          <PickerColumn data={range(1, maxDay)} selected={safeDay} onSelect={setDay} suffix="日" />
          <PickerColumn data={range(0, maxHour)} selected={Math.min(hour, maxHour)} onSelect={setHour} suffix="时" />
          <PickerColumn data={range(0, maxMinute)} selected={Math.min(minute, maxMinute)} onSelect={setMinute} suffix="分" />
        </View>
        {/* 选中行指示线 */}
        <View style={[styles.indicatorLine, { top: ITEM_HEIGHT * 2 }]} pointerEvents="none" />
        <View style={[styles.indicatorLine, { top: ITEM_HEIGHT * 3 }]} pointerEvents="none" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scaleSize(16),
    borderTopRightRadius: scaleSize(16),
    paddingBottom: scaleSize(34),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scaleSize(16),
    height: scaleSize(50),
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  cancelText: { fontSize: scaleSize(16), color: '#999999' },
  title: { fontSize: scaleSize(16), fontWeight: '600', color: '#222222' },
  confirmText: { fontSize: scaleSize(16), color: '#222222', fontWeight: '600' },
  pickerRow: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    position: 'relative',
  },
  column: {
    flex: 1,
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: scaleSize(14),
    color: '#CCCCCC',
  },
  itemTextSelected: {
    fontSize: scaleSize(15),
    color: '#222222',
    fontWeight: '600',
  },
  indicatorLine: {
    position: 'absolute',
    left: scaleSize(12),
    right: scaleSize(12),
    height: 1,
    backgroundColor: '#EEEEEE',
  },
});
