/**
 * 日记底部操作按钮（编辑 + 导出/分享），与生成弹窗样式一致
 */

import { Colors } from '@/constants/theme';
import { EDIT_ICON_URL, EXPORT_ICON_URL } from '@/constants/urls';
import { logByPosition } from '@/services/logService';
import { scaleSize } from '@/utils/screen';
import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export interface DiaryActionButtonsProps {
  onEdit: () => void;
  onExport: () => void;
  editDisabled?: boolean;
  exportDisabled?: boolean;
  exportLoading?: boolean;
  exportLabel?: '分享';
  userId?: string; // 用户ID，用于打点
}

export default function DiaryActionButtons({
  onEdit,
  onExport,
  editDisabled = false,
  exportDisabled = false,
  exportLoading = false,
  exportLabel = '分享',
  userId,
}: DiaryActionButtonsProps) {
  // 包装编辑函数，添加打点
  const handleEdit = () => {
    if (userId) {
      logByPosition('DIARY_EDIT' as any, userId);
    }
    onEdit();
  };

  // 包装导出/分享函数，添加打点
  const handleExport = () => {
    if (userId) {
      logByPosition('DIARY_PREVIEW_SHARE' as any, userId);
    }
    onExport();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.editButton}
        disabled={editDisabled}
        onPress={handleEdit}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: EDIT_ICON_URL }}
          style={styles.actionIcon}
          resizeMode="contain"
        />
        <Text style={styles.editButtonText}>编辑</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.exportButton}
        disabled={exportDisabled || exportLoading}
        onPress={handleExport}
        activeOpacity={0.7}
      >
        {exportLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Image
              source={{ uri: EXPORT_ICON_URL }}
              style={styles.actionIcon}
              resizeMode="contain"
            />
            <Text style={styles.exportButtonText}>{exportLabel}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scaleSize(20),
    paddingTop: scaleSize(20),
    paddingBottom: scaleSize(20),
    gap: scaleSize(12),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(162),
    height: scaleSize(50),
    borderRadius: scaleSize(14),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(10),
    backgroundColor: '#DDDDDD',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: scaleSize(162),
    height: scaleSize(50),
    borderRadius: scaleSize(14),
    paddingVertical: scaleSize(12),
    paddingHorizontal: scaleSize(10),
    backgroundColor: '#000000',
  },
  actionIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
    marginRight: scaleSize(8),
  },
  editButtonText: {
    fontSize: scaleSize(14),
    color: Colors.light.text,
    fontFamily: 'PingFang SC',
  },
  exportButtonText: {
    fontSize: scaleSize(14),
    color: '#FFFFFF',
    fontFamily: 'PingFang SC',
  },
});
