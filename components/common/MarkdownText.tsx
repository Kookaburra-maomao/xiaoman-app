/**
 * Markdown 文本组件（禁用字体缩放）
 */

import React from 'react';
import { Text } from 'react-native';
import Markdown, { MarkdownProps } from 'react-native-markdown-display';

interface MarkdownTextProps extends Omit<MarkdownProps, 'children'> {
  children: string;
}

/**
 * 自定义 Markdown 组件，禁用所有文本的字体缩放
 */
export default function MarkdownText({ children, style, ...props }: MarkdownTextProps) {
  // 创建自定义渲染规则，为所有文本节点添加 allowFontScaling={false}
  const rules = {
    // 覆盖默认的 text 渲染器
    text: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.text} allowFontScaling={false}>
          {node.content}
        </Text>
      );
    },
    // 覆盖 paragraph 渲染器
    paragraph: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.paragraph} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    // 覆盖 strong 渲染器
    strong: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.strong} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    // 覆盖 em 渲染器
    em: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.em} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    // 覆盖 heading 渲染器
    heading1: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.heading1} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    heading2: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.heading2} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    heading3: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.heading3} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    // 覆盖 link 渲染器
    link: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.link} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
    // 覆盖 list_item 渲染器
    list_item: (node: any, children: any, parent: any, styles: any) => {
      return (
        <Text key={node.key} style={styles.list_item} allowFontScaling={false}>
          {children}
        </Text>
      );
    },
  };

  return (
    <Markdown style={style} rules={rules} {...props}>
      {children}
    </Markdown>
  );
}
