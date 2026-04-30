/**
 * IAP 内购 Hook
 * 使用原生 StoreKit 模块
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  getProducts,
  purchase as nativePurchase,
  restorePurchases as nativeRestore,
  getReceipt,
  finishTransaction,
  addPurchaseUpdateListener,
  PRODUCT_IDS,
} from '@/services/nativeIAP';
import { verifyPurchase } from '@/services/iapService';
import { useAuth } from '@/hooks/useAuth';

export function useIAP() {
  const { user, refreshAuth } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // 初始化 IAP
  useEffect(() => {
    if (isInitialized.current || Platform.OS !== 'ios') {
      setIsLoading(false);
      return;
    }

    const setup = async () => {
      try {
        setIsLoading(true);
        const items = await getProducts();
        setProducts(items);
        isInitialized.current = true;
      } catch (e: any) {
        console.error('IAP 初始化失败:', e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    setup();

    // 监听购买更新
    const subscription = addPurchaseUpdateListener((event) => {
      console.log('IAP 事件:', event);
    });

    return () => {
      subscription?.remove();
      isInitialized.current = false;
    };
  }, []);

  // 处理购买
  const handlePurchase = useCallback(
    async (planId: string) => {
      if (!user?.id) {
        Alert.alert('提示', '请先登录');
        return;
      }

      const sku = PRODUCT_IDS[planId as keyof typeof PRODUCT_IDS];
      if (!sku) {
        Alert.alert('错误', '无效的套餐');
        return;
      }

      try {
        setIsPurchasing(true);
        setError(null);

        // 发起购买
        const result = await nativePurchase(sku);

        if (result.state === 'cancelled' || result.state === 'E_USER_CANCELLED') {
          return;
        }

        // 获取收据
        const receipt = await getReceipt();
        if (!receipt) {
          throw new Error('未获取到收据');
        }

        // 调服务端验证
        const verifyResult = await verifyPurchase(user.id, receipt);

        if (verifyResult.code === 200) {
          // 结束交易
          if (result.transactionIdentifier) {
            finishTransaction(result.transactionIdentifier);
          }
          await refreshAuth();
          Alert.alert('成功', '会员开通成功！');
        } else {
          throw new Error(verifyResult.message || '验证失败');
        }
      } catch (e: any) {
        console.error('购买失败:', e);
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
      Alert.alert('恢复购买', '正在恢复您的购买记录...');

      const receipt = await nativeRestore();
      
      if (receipt) {
        const result = await verifyPurchase(user.id, receipt);
        if (result.code === 200) {
          await refreshAuth();
          Alert.alert('成功', '恢复完成');
          return;
        }
      }

      await refreshAuth();
      Alert.alert('提示', '未找到可恢复的订阅');
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
