/**
 * 带虚线的文本组件 - 每行文字下方显示虚线
 */

import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LinedTextProps {
  content: string;
  fontSize?: number;
  lineHeight?: number;
  color?: string;
}

export default function LinedText({
  content,
  fontSize = scaleSize(14),
  lineHeight = scaleSize(22),
  color = Colors.light.text,
}: LinedTextProps) {
  // 将内容按行分割
  const lines = content.split('\n');

  return (
    <View style={styles.container}>
      {lines.map((line, index) => (
        <View key={index} style={styles.lineContainer}>
          <Text
            style={[
              styles.lineText,
              {
                fontSize,
                lineHeight,
                color,
              },
            ]}
          >
            {line || ' '}
          </Text>
          <View style={styles.dashedLine}></View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  lineContainer: {
    position: 'relative',
    marginBottom: scaleSize(11),
  },
  lineText: {
    fontFamily: 'PingFang SC',
    fontWeight: '400',
  },
  dashedLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0.5,
    borderBottomWidth: 0.5,
    borderBottomColor: 'red',
    borderStyle: 'solid',
  },
});
