/**
 * 心情卡片组件
 */

import { Colors } from '@/constants/theme';
import { MOOD_ICONS } from '@/constants/chat';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface MoodCardProps {
  username: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMoodSelect: (label: string) => void;
}

export default function MoodCard({ username, isExpanded, onToggleExpand, onMoodSelect }: MoodCardProps) {
  const expandAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  // 展开/收起动画
  useEffect(() => {
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false, // height 动画不能使用原生驱动
      }),
      Animated.timing(heightAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isExpanded, expandAnim, heightAnim]);

  // 计算心情容器的高度（6个图标，2行，每行3个）
  const moodContainerHeight = 200; // 大约高度

  return (
    <View style={styles.floatingCardContainer}>
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={onToggleExpand}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>
            Hi {username} 今天心情怎么样
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.moodContainerWrapper,
            {
              height: heightAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, moodContainerHeight],
              }),
              opacity: expandAnim,
            },
          ]}
        >
          <View style={styles.moodContainer}>
            {MOOD_ICONS.map((mood, index) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodItem,
                  index < 3 && styles.moodItemFirstRow,
                ]}
                activeOpacity={0.7}
                onPress={() => onMoodSelect(mood.label)}
              >
                <Text style={styles.moodIcon}>{mood.icon}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingCardContainer: {
    // 移除 position: 'absolute' 和 top，因为已经在父组件中定位
    left: 0,
    right: 0,
    paddingBottom: 8,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    borderTopLeftRadius: 0, // 确保顶部没有圆角
    borderTopRightRadius: 0, // 确保顶部没有圆角
    borderBottomLeftRadius: 12, // 左下圆角
    borderBottomRightRadius: 12, // 右下圆角
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    flex: 1,
  },
  moodContainerWrapper: {
    overflow: 'hidden',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  moodItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  moodItemFirstRow: {
    marginBottom: 8,
  },
  moodIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    color: Colors.light.text,
  },
});

