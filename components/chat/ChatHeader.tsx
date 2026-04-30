/**
 * 对话页面头部组件
 */

import { WEEKDAYS } from '@/constants/chat';
import { Colors } from '@/constants/theme';
import { HEADER_DOWN_ICON_URL, HEADER_UP_ICON_URL } from '@/constants/urls';
import { scaleSize } from '@/utils/screen';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatHeaderProps {
  title?: string; // 标题文本，默认为"小满日记"
  showCard: boolean;
  onToggleCard: () => void;
  onShowMenu: () => void;
  isStreaming?: boolean;
  hideCardButton?: boolean; // 是否隐藏运营卡片按钮
  tagImageUrl?: string; // online tag图片URL
}

export default function ChatHeader({ title = '小满日记', showCard, onToggleCard, onShowMenu, isStreaming = false, hideCardButton = false, tagImageUrl }: ChatHeaderProps) {
  // 获取安全区域边距
  const insets = useSafeAreaInsets();
  
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
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle} allowFontScaling={false}>{title}</Text>
          {tagImageUrl ? (
            <Image
              source={{ uri: tagImageUrl.startsWith('http') ? tagImageUrl : `http://xiaomanriji.com${tagImageUrl}` }}
              style={styles.headerTagImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
        <Text style={styles.headerDate} allowFontScaling={false}>
          {month}月{date}日 · {weekday}
        </Text>
      </View>
      
      {/* 中间：方向切换按钮（可选） */}
      {!hideCardButton && (
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
      )}
      
      {/* 右边：三个横线菜单 */}
      <TouchableOpacity
        style={styles.headerRight}
        onPress={onShowMenu}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-common-setting.png' }}
          style={{ width: scaleSize(24), height: scaleSize(24) }}
          resizeMode="contain"
        />
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
    paddingHorizontal: scaleSize(16),
    paddingTop: Platform.OS === 'android' ? scaleSize(30) : 0,
    paddingBottom: scaleSize(20),
    backgroundColor: Colors.light.background,
  },
  headerLeft: {
    flex: 1,
    gap: scaleSize(4),
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: scaleSize(4),
  },
  headerTitle: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: scaleSize(16),
    lineHeight: scaleSize(24),
    letterSpacing: 0,
    color: Colors.light.text,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(6),
  },
  headerTagImage: {
    width: scaleSize(50),
    height: scaleSize(18),
  },
  headerDate: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
    fontSize: scaleSize(11),
    lineHeight: scaleSize(14),
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

