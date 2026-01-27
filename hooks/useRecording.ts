/**
 * 录音功能Hook
 */

import * as imageService from '@/services/imageService';
import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

export const useRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // 音量级别 0-1
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 请求录音权限
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要录音权限才能使用语音功能');
        return false;
      }

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
      setIsRecording(true);
      setRecordingDuration(0);
      setAudioLevel(0);

      // 开始计时
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
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
      Alert.alert('错误', '开始录音失败，请重试');
      return false;
    }
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
  const uploadAndRecognize = useCallback(async (uri: string): Promise<string | null> => {
    try {
      // 上传录音文件
      const uploadResult = await imageService.uploadAudio(uri);
      console.log('上传成功，开始语音识别...');
      
      // 调用 ASR 语音识别
      const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';
      const fileUrl = `${apiUrl}${uploadResult.url}`;
      const recognizedText = await imageService.callASR(fileUrl);
      
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
    startRecording,
    stopRecording,
    cancelRecording,
    uploadAndRecognize,
  };
};

