/**
 * 三点 loading 动画组件
 */

import { scaleSize } from '@/utils/screen';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export default function LoadingDots() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // 三个点的透明度，依次错开相位
  const opacity1 = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [1, 0.6, 0.2, 0.6, 1],
  });
  const opacity2 = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.6, 0.2, 0.6, 1, 0.6],
  });
  const opacity3 = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0.2, 0.6, 1, 0.6, 0.2],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: opacity1 }]} />
      <Animated.View style={[styles.dot, { opacity: opacity2 }]} />
      <Animated.View style={[styles.dot, { opacity: opacity3 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scaleSize(6),
    paddingVertical: scaleSize(4),
  },
  dot: {
    width: scaleSize(8),
    height: scaleSize(8),
    borderRadius: scaleSize(4),
    backgroundColor: '#222222',
  },
});
