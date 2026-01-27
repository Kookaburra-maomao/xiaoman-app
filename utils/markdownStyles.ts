/**
 * Markdown 样式公共配置
 */

import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import { StyleSheet } from 'react-native';

/**
 * 获取 Markdown 样式
 * @param options 可选的样式覆盖选项
 */
export const getMarkdownStyles = (options?: {
  paragraphMarginBottom?: number;
  paragraphPaddingBottom?: number;
  listItemPaddingBottom?: number;
  listItemBorderBottom?: boolean;
  hrBackgroundColor?: string;
  hrHeight?: number;
  hrMarginVertical?: number;
}) => {
  return StyleSheet.create({
    body: {
      fontSize: scaleSize(14),
      lineHeight: scaleSize(22),
      color: Colors.light.text,
      fontFamily: 'PingFang SC',
      fontWeight: '400',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: options?.paragraphMarginBottom ?? scaleSize(8),
      paddingBottom: options?.paragraphPaddingBottom ?? 0,
    },
    heading1: {
      fontSize: scaleSize(18),
      fontWeight: '600',
      marginBottom: scaleSize(8),
      color: Colors.light.text,
      fontFamily: 'PingFang SC',
    },
    heading2: {
      fontSize: scaleSize(16),
      fontWeight: '600',
      marginBottom: scaleSize(8),
      color: Colors.light.text,
      fontFamily: 'PingFang SC',
    },
    heading3: {
      fontSize: scaleSize(14),
      fontWeight: '600',
      marginBottom: scaleSize(8),
      color: Colors.light.text,
      fontFamily: 'PingFang SC',
    },
    strong: {
      fontWeight: '600',
      color: Colors.light.text,
    },
    em: {
      fontStyle: 'italic',
    },
    code_inline: {
      backgroundColor: '#F5F5F5',
      paddingHorizontal: scaleSize(4),
      paddingVertical: scaleSize(2),
      borderRadius: scaleSize(4),
      fontFamily: 'monospace',
      fontSize: scaleSize(12),
    },
    code_block: {
      backgroundColor: '#F5F5F5',
      padding: scaleSize(8),
      borderRadius: scaleSize(4),
      marginVertical: scaleSize(8),
      fontFamily: 'monospace',
      fontSize: scaleSize(12),
    },
    link: {
      color: Colors.light.tint,
      textDecorationLine: 'underline',
    },
    list_item: {
      marginBottom: scaleSize(4),
      paddingBottom: options?.listItemPaddingBottom ?? 0,
      ...(options?.listItemBorderBottom
        ? {
            borderBottomWidth: 0.5,
            borderBottomColor: '#44413A',
          }
        : {}),
    },
    // 任务列表项（- [ ] xxxxxxx）不需要底部边框
    task_list_item: {
      marginBottom: scaleSize(4),
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    // 任务列表项文本
    task_list_item_text: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    // 任务列表容器
    task_list: {
      marginBottom: scaleSize(8),
    },
    bullet_list: {
      marginBottom: scaleSize(8),
    },
    ordered_list: {
      marginBottom: scaleSize(8),
    },
    blockquote: {
      paddingLeft: scaleSize(12),
      marginVertical: scaleSize(8),
      borderLeftWidth: scaleSize(0),
      borderBottomWidth: 0,
      backgroundColor: '#F9F9F9',
      paddingVertical: scaleSize(4),
    },
    // blockquote 内的段落样式
    blockquote_paragraph: {
      marginTop: 0,
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    hr: {
      backgroundColor: options?.hrBackgroundColor ?? '#E5E5E5',
      height: options?.hrHeight ?? scaleSize(1),
      marginVertical: options?.hrMarginVertical ?? scaleSize(8),
    },
  });
};

// 默认样式（用于 DiaryCard）
export const defaultMarkdownStyles = getMarkdownStyles();

// 生成日记弹窗样式（用于 DiaryGenerateModal）
export const diaryModalMarkdownStyles = getMarkdownStyles({
  paragraphMarginBottom: 0,
  paragraphPaddingBottom: scaleSize(11),
  listItemPaddingBottom: scaleSize(11),
  listItemBorderBottom: false,
  hrBackgroundColor: '#44413A',
  hrHeight: 0.5,
  hrMarginVertical: scaleSize(11),
});
