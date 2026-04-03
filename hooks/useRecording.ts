/**
 * 录音功能Hook（使用 expo-audio 替代已弃用的 expo-av）
 */

import * as imageService from '@/services/imageService';
import {
    clearPermissionDenied,
    hasExplainedPermission,
    hasPermissionDenied,
    markPermissionDenied,
    markPermissionExplained,
} from '@/utils/permissionManager';
import {
    RecordingPresets,
    requestRecordingPermissionsAsync,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

const MAX_RECORDING_DURATION = 60; // 最大录音时长（秒）

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showPermissionExplain, setShowPermissionExplain] = useState(false);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopCallbackRef = useRef<(() => void) | null>(null);
  const pendingStartCallbackRef = useRef<(() => void) | null>(null);

  // 使用 expo-audio 的 useAudioRecorder hook
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 200);

  // 通过 recorderState 更新音量
  useEffect(() => {
    if (isRecording && recorderState.metering !== undefined) {
      const normalizedLevel = Math.max(0, Math.min(1, (recorderState.metering + 60) / 60));
      setAudioLevel(normalizedLevel);
    }
  }, [isRecording, recorderState.metering]);

  // 实际开始录音的逻辑
  const actualStartRecording = useCallback(async (onMaxDurationReached?: () => void) => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        await markPermissionDenied('microphone');
        Alert.alert('提示', '需要录音权限才能使用语音功能');
        return false;
      }

      autoStopCallbackRef.current = onMaxDurationReached || null;

      setIsRecording(true);
      setRecordingDuration(0);
      setAudioLevel(0);

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_RECORDING_DURATION) {
            console.log('录音达到最大时长，自动停止');
            if (autoStopCallbackRef.current) {
              autoStopCallbackRef.current();
            }
          }
          return newDuration;
        });
      }, 1000);

      console.log('开始录音');
      return true;
    } catch (error) {
      console.error('开始录音失败:', error);
      setIsRecording(false);
      Alert.alert('错误', '开始录音失败，请重试');
      return false;
    }
  }, [audioRecorder]);

  // 开始录音（带权限说明）
  const startRecording = useCallback(async (onMaxDurationReached?: () => void) => {
    try {
      await clearPermissionDenied('microphone');
      const hasExplained = await hasExplainedPermission('microphone');

      if (!hasExplained) {
        setShowPermissionExplain(true);
        pendingStartCallbackRef.current = () => actualStartRecording(onMaxDurationReached);
        return false;
      } else {
        const wasDenied = await hasPermissionDenied('microphone');
        if (wasDenied) {
          await clearPermissionDenied('microphone');
        }
        return await actualStartRecording(onMaxDurationReached);
      }
    } catch (error) {
      console.error('[Recording] 检查权限说明状态失败:', error);
      return await actualStartRecording(onMaxDurationReached);
    }
  }, [actualStartRecording]);

  const confirmPermission = useCallback(async () => {
    setShowPermissionExplain(false);
    await markPermissionExplained('microphone');
    if (pendingStartCallbackRef.current) {
      await pendingStartCallbackRef.current();
      pendingStartCallbackRef.current = null;
    }
  }, []);

  const cancelPermission = useCallback(() => {
    setShowPermissionExplain(false);
    pendingStartCallbackRef.current = null;
  }, []);

  // 停止录音
  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

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
  }, [audioRecorder, recordingDuration]);

  // 上传录音并调用ASR
  const uploadAndRecognize = useCallback(async (uri: string, userId?: string): Promise<string | null> => {
    try {
      const uploadResult = await imageService.uploadAudio(uri);
      console.log('上传成功，开始语音识别...');
      const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
      const fileUrl = `${apiUrl}${uploadResult.url}`;
      return await imageService.callASR(fileUrl, userId);
    } catch (error: any) {
      console.error('上传或识别失败:', error);
      throw error;
    }
  }, []);

  // 取消录音
  const cancelRecording = useCallback(async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      autoStopCallbackRef.current = null;
      await audioRecorder.stop();
      setIsRecording(false);
      setAudioLevel(0);
      setRecordingDuration(0);
    } catch (error) {
      console.error('取消录音失败:', error);
      setIsRecording(false);
      setAudioLevel(0);
      setRecordingDuration(0);
    }
  }, [audioRecorder]);

  return {
    isRecording,
    recordingDuration,
    audioLevel,
    maxDuration: MAX_RECORDING_DURATION,
    showPermissionExplain,
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAndRecognize,
    confirmPermission,
    cancelPermission,
  };
};
