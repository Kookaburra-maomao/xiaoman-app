/**
 * 打卡成功弹窗组件
 */

import { Colors } from '@/constants/theme';
import { SuccessModalData } from '@/types/plan';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PlanSuccessModalProps {
  visible: boolean;
  data: SuccessModalData | null;
  uploadedImageUrl: string;
  isUploadingImage: boolean;
  onClose: () => void;
  onUploadImage: () => void;
}

export default function PlanSuccessModal({
  visible,
  data,
  uploadedImageUrl,
  isUploadingImage,
  onClose,
  onUploadImage,
}: PlanSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          
          {data && (
            <>
              <Text style={styles.modalTitle}>
                {data.cycleType === 'no' ? '计划已完成' : '计划完成的次数+1'}
              </Text>
              <Text style={styles.modalPlanName}>{data.planName}</Text>
              {data.cycleType !== 'no' && (
                <Text style={styles.modalProgress}>
                  本{data.cycle}已完成 {data.finishTimes}/{data.times}次
                </Text>
              )}
              
              {/* 图片上传区域 */}
              <View style={styles.modalImageContainer}>
                {uploadedImageUrl ? (
                  <TouchableOpacity
                    onPress={onUploadImage}
                    activeOpacity={0.7}
                    disabled={isUploadingImage}
                  >
                    <Image
                      source={{ uri: uploadedImageUrl }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                    {isUploadingImage && (
                      <View style={styles.modalImageOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalImageUploadButton}
                    onPress={onUploadImage}
                    disabled={isUploadingImage}
                    activeOpacity={0.7}
                  >
                    {isUploadingImage ? (
                      <ActivityIndicator size="small" color={Colors.light.tint} />
                    ) : (
                      <>
                        <Ionicons name="image-outline" size={24} color={Colors.light.tint} />
                        <Text style={styles.modalImageUploadText}>上传图片</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalPlanName: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalProgress: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalImageContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalImageUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 8,
    minWidth: 120,
  },
  modalImageUploadText: {
    fontSize: 14,
    color: Colors.light.tint,
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  modalImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

