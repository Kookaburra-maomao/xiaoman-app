/**
 * IAP 内购 Hook
 * 使用 react-native-iap v12
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import RNIap from 'react-native-iap';
import { verifyPurchase } from '@/services/iapService';
import { useAuth } from '@/hooks/useAuth';

const PRODUCT_IDS = ['com.xiaomanriji.vip.monthly', 'com.xiaomanriji.vip.quarterly'];

export function useIAP() {
  const { user, refreshAuth } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const purchaseUpdateSubscription = useRef<any>(null);

  // 初始化 IAP
  useEffect(() => {
    if (isInitialized.current || Platform.OS !== 'ios') {
      setIsLoading(false);
      return;
    }

    const setup = async () => {
      try {
        setIsLoading(true);

        // 初始化 IAP
        await RNIap.initConnection();

        // 获取订阅商品信息
        const items = await RNIap.getSubscriptions(PRODUCT_IDS);
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

    return () => {
      if (purchaseUpdateSubscription.current) {
        purchaseUpdateSubscription.current.remove();
      }
      RNIap.endConnectionAndroid().catch(() => {});
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

      const productIds: Record<string, string> = {
        monthly: 'com.xiaomanriji.vip.monthly',
        quarterly: 'com.xiaomanriji.vip.quarterly',
      };
      const sku = productIds[planId];
      if (!sku) {
        Alert.alert('错误', '无效的套餐');
        return;
      }

      try {
        setIsPurchasing(true);
        setError(null);

        // 发起订阅购买
        const purchase = await RNIap.requestSubscription(sku);

        // 获取收据
        const receipt = purchase.transactionReceipt;
        if (!receipt) {
          throw new Error('未获取到收据');
        }

        // 调服务端验证
        const result = await verifyPurchase(user.id, receipt);

        if (result.code === 200) {
          // 标记交易完成
          await RNIap.finishTransaction(purchase, false);
          // 刷新用户信息
          await refreshAuth();
          Alert.alert('成功', '会员开通成功！');
        } else {
          throw new Error(result.message || '验证失败');
        }
      } catch (e: any) {
        console.error('购买失败:', e);

        // 用户取消购买不弹错误
        if (e.code === 'E_USER_CANCELLED' || e.debugMessage?.includes('cancel')) {
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
      Alert.alert('恢复购买', '正在恢复您的购买记录...');

      // 获取所有购买记录（v12 API）
      const purchases = await RNIap.getAvailablePurchases();
      const validPurchase = purchases.find(
        (p: any) => PRODUCT_IDS.includes(p.productId) && p.transactionReceipt
      );

      if (validPurchase) {
        const result = await verifyPurchase(user.id, validPurchase.transactionReceipt);
        if (result.code === 200) {
          await RNIap.finishTransaction(validPurchase, false);
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
