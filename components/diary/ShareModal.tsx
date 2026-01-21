/**
 * 分享弹窗组件
 */

import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShareModalProps {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
  onSaveImage: () => void;
  onShareWeChat?: () => void;
  onShareQQ?: () => void;
}

export default function ShareModal({
  visible,
  onClose,
  onSaveImage,
  onShareWeChat,
  onShareQQ,
}: ShareModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
          {/* 取消按钮 */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>

          {/* 分享选项 */}
          <View style={styles.optionsContainer}>
            {/* 保存图片 */}
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                onSaveImage();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.optionIconContainer}>
                <Ionicons name="download-outline" size={32} color={Colors.light.text} />
              </View>
              <Text style={styles.optionText}>保存图片</Text>
            </TouchableOpacity>

            {/* 分享微信（暂时不实现） */}
            {onShareWeChat && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onShareWeChat();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="logo-wechat" size={32} color="#07C160" />
                </View>
                <Text style={styles.optionText}>微信好友</Text>
              </TouchableOpacity>
            )}

            {/* 分享QQ（暂时不实现） */}
            {onShareQQ && (
              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  onShareQQ();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="logo-qq" size={32} color="#12B7F5" />
                </View>
                <Text style={styles.optionText}>QQ好友</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  optionItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: Colors.light.text,
    marginTop: 4,
  },
});

