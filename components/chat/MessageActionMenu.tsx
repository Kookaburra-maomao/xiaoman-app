/**
 * 消息操作菜单（复制 + 删除）
 */

import { scaleSize } from "@/utils/screen";
import { setStringAsync } from 'expo-clipboard';
import React, { useState } from 'react';
import {
  Image, Modal,
  StyleSheet, Text,
  TouchableOpacity, TouchableWithoutFeedback, View
} from 'react-native';

const COPY_ICON = 'http://xiaomanriji.com/api/files/xiaoman-icon-copy.png';
const DELETE_ICON = 'http://xiaomanriji.com/api/files/xiaoman-setting-delete.png';

interface MessageActionMenuProps {
  visible: boolean;
  messageText: string;
  onClose: () => void;
  onDelete: () => void;
}

export default function MessageActionMenu({ visible, messageText, onClose, onDelete }: MessageActionMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = async () => {
    if (messageText) await setStringAsync(messageText);
    onClose();
  };

  const handleDeletePress = () => {
    onClose();
    // 延迟显示确认框，等菜单关闭动画完成
    setTimeout(() => setShowDeleteConfirm(true), 300);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      {/* 操作菜单 */}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleCopy} activeOpacity={0.7}>
                <Image source={{ uri: COPY_ICON }} style={styles.menuIcon} resizeMode="contain" />
                <Text style={styles.menuText} allowFontScaling={false}>复制</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleDeletePress} activeOpacity={0.7}>
                <Image source={{ uri: DELETE_ICON }} style={styles.menuIcon} resizeMode="contain" />
                <Text style={styles.menuText} allowFontScaling={false}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 删除确认浮层 */}
      <Modal visible={showDeleteConfirm} transparent animationType="slide" onRequestClose={() => setShowDeleteConfirm(false)}>
        <TouchableWithoutFeedback onPress={() => setShowDeleteConfirm(false)}>
          <View style={styles.confirmOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.confirmSheet}>
          <Text style={styles.confirmTitle} allowFontScaling={false}>确认删除这条对话？</Text>
          <Text style={styles.confirmSubtitle} allowFontScaling={false}>删除后无法恢复对话内容，确认删除吗？</Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDeleteConfirm(false)} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText} allowFontScaling={false}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmDelete} activeOpacity={0.7}>
              <Text style={styles.confirmBtnText} allowFontScaling={false}>确认</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: scaleSize(300),
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(20),
    paddingVertical: scaleSize(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: scaleSize(4) },
    shadowOpacity: 0.15,
    shadowRadius: scaleSize(12),
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scaleSize(24),
    paddingVertical: scaleSize(14),
  },
  menuIcon: {
    width: scaleSize(20),
    height: scaleSize(20),
    marginRight: scaleSize(12),
  },
  menuText: {
    fontSize: scaleSize(16),
    color: '#222222',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: scaleSize(16),
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  confirmSheet: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: scaleSize(24),
    borderTopRightRadius: scaleSize(24),
    paddingTop: scaleSize(24),
    paddingBottom: scaleSize(34),
    paddingHorizontal: scaleSize(20),
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: '#222222',
    marginBottom: scaleSize(12),
  },
  confirmSubtitle: {
    fontSize: scaleSize(14),
    color: '#666666',
    marginBottom: scaleSize(24),
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: scaleSize(12),
  },
  cancelBtn: {
    width: scaleSize(155),
    height: scaleSize(50),
    backgroundColor: '#DDDDDD',
    borderRadius: scaleSize(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: '#222222',
  },
  confirmBtn: {
    width: scaleSize(155),
    height: scaleSize(50),
    backgroundColor: '#000000',
    borderRadius: scaleSize(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: scaleSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
