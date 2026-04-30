/**
 * 权限说明弹窗组件
 * 在申请权限之前向用户说明权限用途
 */

import { Colors } from '@/constants/theme';
import { scaleSize } from '@/utils/screen';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PermissionExplainModalProps {
  visible: boolean;
  permissionType: 'microphone' | 'location' | 'camera' | 'storage';
  onConfirm: () => void;
  onCancel: () => void;
}

const PERMISSION_INFO = {
  microphone: {
    icon: 'mic-outline' as const,
    title: '麦克风权限使用说明',
    description: '为您提供录音记录日记的便捷能力，让您可以通过语音快速记录生活点滴',
    features: [
      '语音录制日记',
      '语音转文字',
      '语音聊天记录',
    ],
  },
  location: {
    icon: 'location-outline' as const,
    title: '位置权限使用说明',
    description: '根据您的位置为您推荐当地的天气和生活服务信息，让日记更有温度',
    features: [
      '自动记录日记地点',
      '获取当地天气信息',
      '推荐周边生活服务',
    ],
  },
  camera: {
    icon: 'camera-outline' as const,
    title: '相机权限使用说明',
    description: '为您提供拍照记录日记的便捷能力，让您可以用图片记录美好瞬间',
    features: [
      '拍照记录日记',
      '扫描二维码',
      '图片识别',
    ],
  },
  storage: {
    icon: 'folder-outline' as const,
    title: '存储权限使用说明',
    description: '为您提供保存和读取图片的能力，让您可以保存日记图片到相册',
    features: [
      '保存日记图片',
      '读取相册图片',
      '分享日记内容',
    ],
  },
};

export default function PermissionExplainModal({
  visible,
  permissionType,
  onConfirm,
  onCancel,
}: PermissionExplainModalProps) {
  const info = PERMISSION_INFO[permissionType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 图标 */}
          <View style={styles.iconContainer}>
            <Ionicons name={info.icon} size={scaleSize(48)} color={Colors.light.tint} />
          </View>

          {/* 标题 */}
          <Text style={styles.title}>{info.title}</Text>

          {/* 描述 */}
          <Text style={styles.description}>{info.description}</Text>

          {/* 功能列表 */}
          <View style={styles.featureList}>
            {info.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* 按钮 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmButtonText}>继续</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scaleSize(20),
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: scaleSize(16),
    padding: scaleSize(24),
    width: '100%',
    maxWidth: scaleSize(320),
    alignItems: 'center',
  },
  iconContainer: {
    width: scaleSize(80),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scaleSize(16),
  },
  title: {
    fontSize: scaleSize(18),
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: scaleSize(12),
    textAlign: 'center',
  },
  description: {
    fontSize: scaleSize(14),
    color: '#666666',
    lineHeight: scaleSize(20),
    textAlign: 'center',
    marginBottom: scaleSize(20),
  },
  featureList: {
    width: '100%',
    marginBottom: scaleSize(24),
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scaleSize(12),
  },
  featureDot: {
    width: scaleSize(6),
    height: scaleSize(6),
    borderRadius: scaleSize(3),
    backgroundColor: Colors.light.tint,
    marginRight: scaleSize(12),
  },
  featureText: {
    fontSize: scaleSize(14),
    color: Colors.light.text,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    height: scaleSize(44),
    borderRadius: scaleSize(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.light.tint,
  },
  confirmButtonText: {
    fontSize: scaleSize(16),
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
