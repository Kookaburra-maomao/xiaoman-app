/**
 * 打字机效果Hook
 */

import { useRef, useCallback } from 'react';

export const useTypewriter = (onUpdate: (messageId: string, text: string) => void) => {
  const displayedTextRef = useRef<string>('');
  const targetTextRef = useRef<string>('');
  const typewriterMessageIdRef = useRef<string>('');
  const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 停止打字机效果
  const stopTypewriter = useCallback(() => {
    if (typewriterTimerRef.current) {
      clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
  }, []);

  // 启动打字机效果
  const startTypewriter = useCallback(() => {
    // 如果定时器已经在运行，不需要重新创建
    if (typewriterTimerRef.current) {
      return;
    }

    typewriterTimerRef.current = setInterval(() => {
      const targetText = targetTextRef.current;
      const messageId = typewriterMessageIdRef.current;
      const currentDisplay = displayedTextRef.current;

      // 如果目标文本比当前显示文本长，继续显示下一个字符
      if (targetText.length > currentDisplay.length) {
        // 每次显示一个字符
        const nextChar = targetText[currentDisplay.length];
        displayedTextRef.current = currentDisplay + nextChar;
        onUpdate(messageId, displayedTextRef.current);
      }
      // 注意：不在这里停止定时器，让它在流式数据到达时继续运行
    }, 20); // 每20ms显示一个字符
  }, [onUpdate]);

  // 更新目标文本并启动打字机效果
  const updateTypewriterTarget = useCallback((
    newText: string,
    messageId: string
  ) => {
    targetTextRef.current = newText;
    typewriterMessageIdRef.current = messageId;
    
    // 确保打字机正在运行
    if (!typewriterTimerRef.current) {
      startTypewriter();
    }
  }, [startTypewriter]);

  // 等待打字机效果完成
  const waitForTypewriter = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (displayedTextRef.current.length >= targetTextRef.current.length || !typewriterTimerRef.current) {
          clearInterval(checkInterval);
          // 确保最终文本完全显示
          displayedTextRef.current = targetTextRef.current;
          onUpdate(typewriterMessageIdRef.current, targetTextRef.current);
          stopTypewriter();
          resolve();
        }
      }, 100);
      
      // 最多等待5秒
      setTimeout(() => {
        clearInterval(checkInterval);
        displayedTextRef.current = targetTextRef.current;
        onUpdate(typewriterMessageIdRef.current, targetTextRef.current);
        stopTypewriter();
        resolve();
      }, 5000);
    });
  }, [onUpdate, stopTypewriter]);

  // 重置打字机状态
  const resetTypewriter = useCallback(() => {
    displayedTextRef.current = '';
    targetTextRef.current = '';
    typewriterMessageIdRef.current = '';
    stopTypewriter();
  }, [stopTypewriter]);

  return {
    displayedTextRef,
    targetTextRef,
    typewriterMessageIdRef,
    stopTypewriter,
    startTypewriter,
    updateTypewriterTarget,
    waitForTypewriter,
    resetTypewriter,
  };
};

