import { scaleSize } from '@/utils/screen';
import { getUnreadCount } from '@/utils/unread-messages';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TabConfig {
  chinese: string;
  english: string;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  record: { chinese: '记录', english: 'Past' },
  chat: { chinese: '对话', english: 'Now' },
  plan: { chinese: '计划', english: 'Future' },
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  // 定期检查未读消息数量
  useEffect(() => {
    const checkUnreadCount = async () => {
      const count = await getUnreadCount();
      setUnreadCount(count);
    };

    checkUnreadCount();
    const interval = setInterval(checkUnreadCount, 1000); // 每秒检查一次

    return () => clearInterval(interval);
  }, []);
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tabConfig = TAB_CONFIGS[route.name] || { chinese: route.name, english: '' };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const showBadge = route.name === 'chat' && unreadCount > 0;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <View style={styles.textContainer}>
                <Text style={isFocused ? styles.chineseTextActive : styles.chineseTextInactive}>
                  {tabConfig.chinese}
                </Text>
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              {isFocused ? (
                <LinearGradient
                  colors={['#eb4b71', '#f7cc9a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBackground}
                >
                  <Text style={styles.englishTextActive}>{tabConfig.english}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.englishTextInactive}>{tabConfig.english}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingTop: 0,
    paddingBottom: 0,
    height: scaleSize(76),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scaleSize(4),
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: scaleSize(2),
  },
  textContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: scaleSize(-6),
    right: scaleSize(-12),
    backgroundColor: '#FF0000',
    borderRadius: scaleSize(8),
    minWidth: scaleSize(16),
    height: scaleSize(16),
    paddingHorizontal: scaleSize(4),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scaleSize(1),
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: scaleSize(10),
    fontWeight: 'bold',
    lineHeight: scaleSize(12),
  },
  gradientBackground: {
    height: scaleSize(12),
    paddingHorizontal: scaleSize(8),
    paddingVertical: scaleSize(1),
    borderRadius: scaleSize(6),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scaleSize(30),
    marginTop: scaleSize(2),
  },
  chineseTextActive: {
    fontSize: scaleSize(15),
    lineHeight: scaleSize(18),
    color: '#222',
    fontWeight: '600',
  },
  englishTextActive: {
    fontSize: scaleSize(8),
    lineHeight: scaleSize(10),
    color: '#FFFFFF',
  },
  chineseTextInactive: {
    fontSize: scaleSize(15),
    lineHeight: scaleSize(18),
    color: '#666',
    fontWeight: '500',
  },
  englishTextInactive: {
    fontSize: scaleSize(8),
    lineHeight: scaleSize(10),
    color: '#666',
    marginTop: scaleSize(1),
  },
});

