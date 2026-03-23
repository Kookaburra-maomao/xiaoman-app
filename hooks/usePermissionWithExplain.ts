/**
 * 带说明的权限申请 Hook
 * 在申请权限之前显示说明弹窗
 */

import { hasExplainedPermission, markPermissionExplained } from '@/utils/permissionManager';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

type PermissionType = 'microphone' | 'location' | 'camera' | 'storage';

export const usePermissionWithExplain = () => {
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [currentPermissionType, setCurrentPermissionType] = useState<PermissionType>('microphone');
  const [pendingCallback, setPendingCallback] = useState<((granted: boolean) => void) | null>(null);

  /**
   * 申请麦克风权限
   */
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // 检查是否已经说明过
        const hasExplained = await hasExplainedPermission('microphone');
        
        if (!hasExplained) {
          // 显示说明弹窗
          setCurrentPermissionType('microphone');
          setShowExplainModal(true);
          setPendingCallback(() => async (shouldRequest: boolean) => {
            if (shouldRequest) {
              // 标记已说明
              await markPermissionExplained('microphone');
              // 申请权限
              const { status } = await Audio.requestPermissionsAsync();
              resolve(status === 'granted');
            } else {
              resolve(false);
            }
          });
        } else {
          // 已经说明过，直接申请权限
          const { status } = await Audio.requestPermissionsAsync();
          resolve(status === 'granted');
        }
      } catch (error) {
        console.error('[Permission] 申请麦克风权限失败:', error);
        resolve(false);
      }
    });
  }, []);

  /**
   * 申请位置权限
   */
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // 检查是否已经说明过
        const hasExplained = await hasExplainedPermission('location');
        
        if (!hasExplained) {
          // 显示说明弹窗
          setCurrentPermissionType('location');
          setShowExplainModal(true);
          setPendingCallback(() => async (shouldRequest: boolean) => {
            if (shouldRequest) {
              // 标记已说明
              await markPermissionExplained('location');
              // 申请权限
              const { status } = await Location.requestForegroundPermissionsAsync();
              resolve(status === 'granted');
            } else {
              resolve(false);
            }
          });
        } else {
          // 已经说明过，直接申请权限
          const { status } = await Location.requestForegroundPermissionsAsync();
          resolve(status === 'granted');
        }
      } catch (error) {
        console.error('[Permission] 申请位置权限失败:', error);
        resolve(false);
      }
    });
  }, []);

  /**
   * 申请相机权限
   */
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // 检查是否已经说明过
        const hasExplained = await hasExplainedPermission('camera');
        
        if (!hasExplained) {
          // 显示说明弹窗
          setCurrentPermissionType('camera');
          setShowExplainModal(true);
          setPendingCallback(() => async (shouldRequest: boolean) => {
            if (shouldRequest) {
              // 标记已说明
              await markPermissionExplained('camera');
              // 申请权限
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              resolve(status === 'granted');
            } else {
              resolve(false);
            }
          });
        } else {
          // 已经说明过，直接申请权限
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          resolve(status === 'granted');
        }
      } catch (error) {
        console.error('[Permission] 申请相机权限失败:', error);
        resolve(false);
      }
    });
  }, []);

  /**
   * 申请存储权限
   */
  const requestStoragePermission = useCallback(async (): Promise<boolean> => {
    return new Promise(async (resolve) => {
      try {
        // 检查是否已经说明过
        const hasExplained = await hasExplainedPermission('storage');
        
        if (!hasExplained) {
          // 显示说明弹窗
          setCurrentPermissionType('storage');
          setShowExplainModal(true);
          setPendingCallback(() => async (shouldRequest: boolean) => {
            if (shouldRequest) {
              // 标记已说明
              await markPermissionExplained('storage');
              // 申请权限
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              resolve(status === 'granted');
            } else {
              resolve(false);
            }
          });
        } else {
          // 已经说明过，直接申请权限
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          resolve(status === 'granted');
        }
      } catch (error) {
        console.error('[Permission] 申请存储权限失败:', error);
        resolve(false);
      }
    });
  }, []);

  /**
   * 用户确认授权
   */
  const handleConfirm = useCallback(() => {
    setShowExplainModal(false);
    if (pendingCallback) {
      pendingCallback(true);
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  /**
   * 用户取消授权
   */
  const handleCancel = useCallback(() => {
    setShowExplainModal(false);
    if (pendingCallback) {
      pendingCallback(false);
      setPendingCallback(null);
    }
  }, [pendingCallback]);

  return {
    showExplainModal,
    currentPermissionType,
    requestMicrophonePermission,
    requestLocationPermission,
    requestCameraPermission,
    requestStoragePermission,
    handleConfirm,
    handleCancel,
  };
};
