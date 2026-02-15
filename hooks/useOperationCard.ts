/**
 * 运营卡片管理 Hook
 * 用于管理运营卡片的获取、显示/隐藏状态和动画
 */

import { getOperationCards, OperationCard } from '@/services/chatService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

// 缓存键名
const CARD_TIMESTAMP_KEY = '@operation_card_last_shown';

interface UseOperationCardOptions {
  /**
   * 是否自动检查并展示运营卡片（基于30分钟缓存规则）
   * 默认为 true
   */
  autoCheck?: boolean;
  /**
   * 初始显示状态
   * 默认为 false
   */
  initialShowCard?: boolean;
}

export function useOperationCard(options: UseOperationCardOptions = {}) {
  const { autoCheck = true, initialShowCard = false } = options;

  const [showCard, setShowCard] = useState(initialShowCard);
  const [operationCards, setOperationCards] = useState<OperationCard[]>([]);
  const cardSlideAnim = useRef(new Animated.Value(0)).current; // 卡片透明度动画值
  const cardTranslateY = useRef(new Animated.Value(0)).current; // 卡片垂直位移动画值

  // 获取运营卡片
  const fetchOperationCards = useCallback(async () => {
    try {
      console.log('[useOperationCard] 开始获取运营卡片...');
      const cards = await getOperationCards();
      console.log('[useOperationCard] 获取到运营卡片数量:', cards.length);
      setOperationCards(cards);
      return cards;
    } catch (error) {
      console.error('[useOperationCard] 获取运营卡片失败:', error);
      setOperationCards([]);
      return [];
    }
  }, []);

  // 检查是否应该展示运营卡片（基于30分钟缓存规则）
  const checkShouldShowCard = useCallback(async () => {
    if (!autoCheck) return false;

    try {
      const lastShownTimestamp = await AsyncStorage.getItem(CARD_TIMESTAMP_KEY);
      
      if (!lastShownTimestamp) {
        // 没有缓存，首次进入，展示卡片并记录时间戳
        setShowCard(true);
        await AsyncStorage.setItem(CARD_TIMESTAMP_KEY, Date.now().toString());
        return true;
      }

      const lastShownTime = parseInt(lastShownTimestamp, 10);
      const currentTime = Date.now();
      const timeDiff = currentTime - lastShownTime;
      const thirtyMinutesInMs = 30 * 60 * 1000; // 30分钟

      if (timeDiff > thirtyMinutesInMs) {
        // 超过30分钟，展示卡片并更新时间戳
        setShowCard(true);
        await AsyncStorage.setItem(CARD_TIMESTAMP_KEY, currentTime.toString());
        return true;
      } else {
        // 未超过30分钟，不展示卡片
        setShowCard(false);
        return false;
      }
    } catch (error) {
      console.error('[useOperationCard] 检查运营卡片展示状态失败:', error);
      // 出错时默认展示卡片
      setShowCard(true);
      return true;
    }
  }, [autoCheck]);

  // 运营卡片显示/隐藏动画
  useEffect(() => {
    console.log('[useOperationCard] showCard 状态变化:', showCard);
    console.log('[useOperationCard] operationCards 数量:', operationCards.length);
    
    if (showCard) {
      // 显示：渐显 + 下拉出现
      Animated.parallel([
        Animated.timing(cardSlideAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // 隐藏：渐隐 + 上拉消失
      Animated.parallel([
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardTranslateY, {
          toValue: -60,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCard, cardSlideAnim, cardTranslateY, operationCards.length]);

  // 切换卡片显示状态
  const toggleCard = useCallback(() => {
    console.log('[useOperationCard] 切换卡片，当前 showCard:', showCard, '-> 切换为:', !showCard);
    setShowCard(!showCard);
  }, [showCard]);

  // 隐藏卡片
  const hideCard = useCallback(() => {
    setShowCard(false);
  }, []);

  // 显示卡片
  const displayCard = useCallback(() => {
    setShowCard(true);
  }, []);

  return {
    // 状态
    showCard,
    operationCards,
    cardSlideAnim,
    cardTranslateY,
    
    // 方法
    setShowCard,
    fetchOperationCards,
    checkShouldShowCard,
    toggleCard,
    hideCard,
    displayCard,
  };
}
