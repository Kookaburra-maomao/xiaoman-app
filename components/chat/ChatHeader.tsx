/**
 * 对话页面头部组件
 */

import { WEEKDAYS } from '@/constants/chat';
import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HEADER_UP_ICON_URL = 'http://39.103.63.159/api/files/header-up.png';
const HEADER_DOWN_ICON_URL = 'http://39.103.63.159/api/files/header-down.png';

interface ChatHeaderProps {
  showCard: boolean;
  onToggleCard: () => void;
  onShowMenu: () => void;
  isStreaming?: boolean;
}

export default function ChatHeader({ showCard, onToggleCard, onShowMenu, isStreaming = false }: ChatHeaderProps) {
  // 获取当前日期信息
  const today = new Date();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const weekday = WEEKDAYS[today.getDay()];

  // 处理切换按钮点击
  const handleToggleCard = () => {
    if (isStreaming) {
      // 如果正在流式传输，显示提示
      Alert.alert('提示', '回复中，请稍后');
      return;
    }
    onToggleCard();
  };

  return (
    <View style={styles.header}>
      {/* 左边：标题和日期信息 */}
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>小满日记</Text>
        <Text style={styles.headerDate}>
          {month}月{date}日 · {weekday}
        </Text>
      </View>
      
      {/* 中间：方向切换按钮 */}
      <TouchableOpacity
        style={styles.headerCenter}
        onPress={handleToggleCard}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: showCard ? HEADER_UP_ICON_URL : HEADER_DOWN_ICON_URL }}
          style={[styles.headerIcon, isStreaming && styles.headerIconDisabled]}
          resizeMode="contain"
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
  headerTitle: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: Colors.light.text,
  },
  headerDate: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0,
    color: Colors.light.text,
  },
  headerIcon: {
    width: scaleSize(46),
    height: scaleSize(46),
  },
  headerIconDisabled: {
    opacity: 0.3,
  },
});

