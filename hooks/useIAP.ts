/**
 * IAP 内购 Hook
 * 封装 expo-in-app-purchases 的完整购买流程
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  connectAsync,
  finishTransactionAsync,
  getProductsAsync,
  IAPItemDetails,
  purchaseItemAsync,
  IAPResponseCode,
  disconnectAsync,
} from 'expo-in-app-purchases';
import { verifyPurchase, restorePurchase } from '@/services/iapService';
import { useAuth } from '@/hooks/useAuth';

// 商品 ID 常量
const PRODUCT_IDS = {
  monthly: 'com.xiaomanriji.vip.monthly',
  quarterly: 'com.xiaomanriji.vip.quarterly',
};

export function useIAP() {
  const { user, refreshAuth } = useAuth();
  const [products, setProducts] = useState<IAPItemDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // 初始化 IAP 连接
  const initIAP = useCallback(async () => {
    if (isInitialized.current || Platform.OS !== 'ios') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // expo-in-app-purchases 的 connectAsync 在 iOS 上返回 IAPQueryResponse
      // 但类型定义可能不一致，用 any 处理
      await (connectAsync as any)();

      // 获取商品信息
      const productIds = [PRODUCT_IDS.monthly, PRODUCT_IDS.quarterly];
      const response = await (getProductsAsync as any)(productIds);
      const { responseCode, results } = response || {};

      if (responseCode === IAPResponseCode.OK && results) {
        setProducts(results);
      }
      isInitialized.current = true;
    } catch (e: any) {
      console.error('IAP 初始化失败:', e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 连接 IAP
  useEffect(() => {
    initIAP();
    return () => {
      disconnectAsync().catch(() => {});
      isInitialized.current = false;
    };
  }, [initIAP]);

  // 处理购买
  const handlePurchase = useCallback(
    async (planId: string) => {
      if (!user?.id) {
        Alert.alert('提示', '请先登录');
        return;
      }

      const productId = PRODUCT_IDS[planId as keyof typeof PRODUCT_IDS];
      if (!productId) {
        Alert.alert('错误', '无效的套餐');
        return;
      }

      try {
        setIsPurchasing(true);
        setError(null);

        // 发起购买
        const purchaseResponse = await (purchaseItemAsync as any)(productId);
        const { responseCode, results } = purchaseResponse || {};

        if (responseCode !== IAPResponseCode.OK) {
          throw new Error(`购买失败 (${responseCode})`);
        }

        // 处理购买结果
        const purchase = results?.[0];
        if (!purchase) {
          throw new Error('未获取到购买信息');
        }

        // 获取收据数据
        const receipt = purchase.transactionReceipt;
        if (!receipt) {
          throw new Error('未获取到收据');
        }

        // 调服务端验证
        const result = await verifyPurchase(user.id, receipt);

        if (result.code === 200) {
          // 标记交易完成
          await finishTransactionAsync(purchase, true);
          // 刷新用户信息
          await refreshAuth();
          Alert.alert('成功', '会员开通成功！');
        } else {
          throw new Error(result.message || '验证失败');
        }
      } catch (e: any) {
        console.error('购买失败:', e);

        // 用户取消购买不弹错误
        if (
          e.message?.includes('User cancelled') ||
          e.message?.includes('702')
        ) {
          return;
        }

        setError(e.message);
        Alert.alert('购买失败', e.message || '请稍后重试');
      } finally {
        setIsPurchasing(false);
      }
    },
    [user?.id, refreshAuth]
  );

  // 恢复购买
  const handleRestore = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('提示', '请先登录');
      return;
    }

    try {
      setIsPurchasing(true);

      // 连接后再恢复
      await connectAsync();
      const { responseCode, results } = await getProductsAsync([
        PRODUCT_IDS.monthly,
        PRODUCT_IDS.quarterly,
      ]);

      if (responseCode !== IAPResponseCode.OK) {
        throw new Error('获取购买记录失败');
      }

      // 从本地收据恢复（需要重新验证）
      // expo-in-app-purchases 的 restore 通过 reconnect 自动恢复
      // 这里重新连接会触发历史交易
      Alert.alert('恢复购买', '正在恢复您的购买记录，请稍候...');

      // 重新连接后会触发已完成的交易
      // 实际恢复需要用户有本地收据，通过服务端验证
      await refreshAuth();
      Alert.alert('提示', '恢复完成，请检查您的会员状态');
    } catch (e: any) {
      console.error('恢复购买失败:', e);
      Alert.alert('恢复失败', e.message || '请稍后重试');
    } finally {
      setIsPurchasing(false);
    }
  }, [user?.id, refreshAuth]);

  return {
    products,
    isLoading,
    isPurchasing,
    error,
    purchase: handlePurchase,
    restorePurchases: handleRestore,
  };
}
