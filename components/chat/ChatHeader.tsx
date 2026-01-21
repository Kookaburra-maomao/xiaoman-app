/**
 * 对话页面头部组件
 */

import { WEEKDAYS } from '@/constants/chat';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatHeaderProps {
  showCard: boolean;
  onToggleCard: () => void;
  onShowMenu: () => void;
}

export default function ChatHeader({ showCard, onToggleCard, onShowMenu }: ChatHeaderProps) {
  // 获取当前日期信息
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekday = WEEKDAYS[today.getDay()];

  // 模拟地址和天气（实际应该从API获取）
  const location = '杭州';
  const weather = '晴';

  return (
    <View style={styles.header}>
      {/* 左边：日期信息 */}
      <View style={styles.headerLeft}>
        <Text style={styles.headerDate}>
          {month}月{date}日 {weekday}
        </Text>
        <Text style={styles.headerLocation}>
          {location} {weather}
        </Text>
      </View>
      
      {/* 中间：方向切换按钮 */}
      <TouchableOpacity
        style={styles.headerCenter}
        onPress={onToggleCard}
        activeOpacity={0.7}
      >
        <Ionicons
          name={showCard ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.light.text}
        />
      </TouchableOpacity>
      
      {/* 右边：三个横线菜单 */}
      <TouchableOpacity
        style={styles.headerRight}
        onPress={onShowMenu}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={24} color={Colors.light.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    // 添加阴影效果
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android 阴影
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  headerDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerLocation: {
    fontSize: 14,
    color: Colors.light.icon,
  },
});

