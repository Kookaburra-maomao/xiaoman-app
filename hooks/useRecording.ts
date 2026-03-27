/**
 * 录音功能Hook
 */

import * as imageService from '@/services/imageService';
import {
    clearPermissionDenied,
    hasExplainedPermission,
    hasPermissionDenied,
    markPermissionDenied,
    markPermissionExplained,
} from '@/utils/permissionManager';
import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

const MAX_RECORDING_DURATION = 60; // 最大录音时长（秒）

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // 音量级别 0-1
  const [showPermissionExplain, setShowPermissionExplain] = useState(false); // 是否显示权限说明
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopCallbackRef = useRef<(() => void) | null>(null); // 自动停止回调
  const pendingStartCallbackRef = useRef<(() => void) | null>(null); // 待执行的开始录音回调

  // 实际开始录音的逻辑
  const actualStartRecording = useCallback(async (onMaxDurationReached?: () => void) => {
    try {
      // 请求录音权限
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        // 记录用户拒绝了麦克风权限
        await markPermissionDenied('microphone');
        Alert.alert('提示', '需要录音权限才能使用语音功能');
        return false;
      }

      // 保存自动停止回调
      autoStopCallbackRef.current = onMaxDurationReached || null;

      // 立即设置录音状态，让UI快速响应
      setIsRecording(true);
      setRecordingDuration(0);
      setAudioLevel(0);

      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 创建录音实例，启用 metering 以获取音量数据
      const { recording } = await Audio.Recording.createAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true, // 启用音量检测
      });

      recordingRef.current = recording;

      // 开始计时
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          
          // 检查是否达到最大时长
          if (newDuration >= MAX_RECORDING_DURATION) {
            console.log('录音达到最大时长，自动停止');
            // 触发自动停止回调
            if (autoStopCallbackRef.current) {
              autoStopCallbackRef.current();
            }
          }
          
          return newDuration;
        });
      }, 1000);

      // 监听录音状态，获取音量数据
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording && status.metering !== undefined) {
          // 将 dB 值转换为 0-1 的范围
          // metering 通常在 -160 到 0 之间，我们将其映射到 0-1
          const normalizedLevel = Math.max(0, Math.min(1, (status.metering + 60) / 60));
          setAudioLevel(normalizedLevel);
        }
      });

      console.log('开始录音');
      return true;
    } catch (error) {
      console.error('开始录音失败:', error);
      setIsRecording(false); // 出错时重置状态
      Alert.alert('错误', '开始录音失败，请重试');
      return false;
    }
  }, []);

  // 开始录音（带权限说明）
  const startRecording = useCallback(async (onMaxDurationReached?: () => void) => {
    try {
      // 用户主动触发录音，清除之前的拒绝记录
      await clearPermissionDenied('microphone');
      
      // 检查是否已经说明过麦克风权限
      const hasExplained = await hasExplainedPermission('microphone');
      
      if (!hasExplained) {
        // 需要先显示权限说明
        console.log('[Recording] 需要显示麦克风权限说明');
        setShowPermissionExplain(true);
        // 保存待执行的回调
        pendingStartCallbackRef.current = () => actualStartRecording(onMaxDurationReached);
        return false;
      } else {
        // 已经说明过，检查是否被拒绝过
        const wasDenied = await hasPermissionDenied('microphone');
        if (wasDenied) {
          // 用户之前拒绝过权限，但现在主动触发，所以清除拒绝记录并尝试申请
          console.log('[Recording] 用户主动触发，清除拒绝记录');
          await clearPermissionDenied('microphone');
        }
        
        // 直接开始录音
        return await actualStartRecording(onMaxDurationReached);
      }
    } catch (error) {
      console.error('[Recording] 检查权限说明状态失败:', error);
      // 出错时直接尝试开始录音
      return await actualStartRecording(onMaxDurationReached);
    }
  }, [actualStartRecording]);

  // 用户确认授权（从权限说明弹窗）
  const confirmPermission = useCallback(async () => {
    setShowPermissionExplain(false);
    // 标记已说明
    await markPermissionExplained('microphone');
    // 执行待执行的开始录音回调
    if (pendingStartCallbackRef.current) {
      await pendingStartCallbackRef.current();
      pendingStartCallbackRef.current = null;
    }
  }, []);

  // 用户取消授权（从权限说明弹窗）
  const cancelPermission = useCallback(() => {
    setShowPermissionExplain(false);
    pendingStartCallbackRef.current = null;
    console.log('[Recording] 用户取消授权麦克风权限');
  }, []);

  // 停止录音
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (!recordingRef.current) {
        return null;
      }

      // 停止计时
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // 停止录音
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      recordingRef.current = null;
      setIsRecording(false);
      setAudioLevel(0);
      const duration = recordingDuration;
      setRecordingDuration(0);

      if (uri) {
        console.log('录音文件路径:', uri);
        console.log('录音时长:', duration, '秒');
        return uri;
      }
      
      return null;
    } catch (error) {
      console.error('停止录音失败:', error);
      Alert.alert('错误', '停止录音失败');
      setIsRecording(false);
      setRecordingDuration(0);
      return null;
    }
  }, [recordingDuration]);

  // 上传录音并调用ASR
  const uploadAndRecognize = useCallback(async (uri: string, userId?: string): Promise<string | null> => {
    try {
      // 上传录音文件
      const uploadResult = await imageService.uploadAudio(uri);
      console.log('上传成功，开始语音识别...');
      
      // 调用 ASR 语音识别
      const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
      const fileUrl = `${apiUrl}${uploadResult.url}`;
      const recognizedText = await imageService.callASR(fileUrl, userId);
      
      return recognizedText;
    } catch (error: any) {
      console.error('上传或识别失败:', error);
      throw error;
    }
  }, []);

  // 取消录音（不处理录音文件）
  const cancelRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) {
        return;
      }

      // 停止计时
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // 清除自动停止回调
      autoStopCallbackRef.current = null;

      // 停止并卸载录音
      await recordingRef.current.stopAndUnloadAsync();
      
      recordingRef.current = null;
      setIsRecording(false);
      setAudioLevel(0);
      setRecordingDuration(0);
    } catch (error) {
      console.error('取消录音失败:', error);
      setIsRecording(false);
      setAudioLevel(0);
      setRecordingDuration(0);
    }
  }, []);

  return {
    isRecording,
    recordingDuration,
    audioLevel, // 导出音量级别
    maxDuration: MAX_RECORDING_DURATION, // 导出最大时长
    showPermissionExplain, // 导出权限说明弹窗状态
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAndRecognize,
    confirmPermission, // 导出确认授权方法
    cancelPermission, // 导出取消授权方法
  };
};

