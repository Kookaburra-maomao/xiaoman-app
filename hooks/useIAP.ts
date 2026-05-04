import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getTransactionJwsIOS,
  getReceiptDataIOS,
  type Purchase,
  type ProductSubscription,
} from 'expo-iap';
import { verifyPurchase, restorePurchase, PRODUCT_IDS } from '@/services/iapService';
import { useAuth } from '@/hooks/useAuth';

export function useIAP() {
  const { user, refreshAuth } = useAuth();
  const [products, setProducts] = useState<ProductSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const purchaseResolveRef = useRef<((purchase: Purchase) => void) | null>(null);

  useEffect(() => {
    if (isInitialized.current || Platform.OS !== 'ios') {
      setIsLoading(false);
      return;
    }

    const setup = async () => {
      try {
        setIsLoading(true);
        await initConnection();

        const skus = Object.values(PRODUCT_IDS);
        const items = await fetchProducts({ skus, type: 'subs' });
        setProducts((items ?? []) as ProductSubscription[]);
        isInitialized.current = true;
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    setup();

    const purchaseSub = purchaseUpdatedListener(async (purchase: Purchase) => {
      if (purchaseResolveRef.current) {
        purchaseResolveRef.current(purchase);
        purchaseResolveRef.current = null;
      }
    });

    const errorSub = purchaseErrorListener((err) => {
      console.error('IAP 购买错误:', err);
      purchaseResolveRef.current = null;
    });

    return () => {
      purchaseSub?.remove();
      errorSub?.remove();
      endConnection();
      isInitialized.current = false;
    };
  }, []);

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

        await requestPurchase({
          request: { apple: { sku } },
          type: 'subs',
        });

        // 获取 JWS token 用于服务端验证
        let transactionJws = '';
        try {
          transactionJws = (await getTransactionJwsIOS(sku)) ?? '';
        } catch {
          // fallback: 无法获取 JWS
        }

        let receiptData: string | undefined;
        if (!transactionJws) {
          try {
            receiptData = (await getReceiptDataIOS()) ?? undefined;
          } catch {
            // ignore
          }
        }

        if (!transactionJws && !receiptData) {
          throw new Error('未获取到交易凭证');
        }

        const verifyResult = await verifyPurchase(
          user.id,
          transactionJws,
          receiptData,
        );

        if (verifyResult.code === 200) {
          const purchases = await getAvailablePurchases();
          const matched = (purchases ?? []).find(
            (p: Purchase) => p.productId === sku,
          );
          if (matched) {
            await finishTransaction({ purchase: matched });
          }
          await refreshAuth();
          Alert.alert('成功', '会员开通成功！');
        } else {
          throw new Error(verifyResult.message || '验证失败');
        }
      } catch (e: any) {
        console.error('购买失败:', e);
        setError(e.message);
        if (
          e.code === 'E_USER_CANCELLED' ||
          e.message?.includes('cancel')
        ) {
          return;
        }
        Alert.alert('购买失败', e.message || '请稍后重试');
      } finally {
        setIsPurchasing(false);
      }
    },
    [user?.id, refreshAuth],
  );

  const handleRestore = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('提示', '请先登录');
      return;
    }

    try {
      setIsPurchasing(true);

      const purchases = await getAvailablePurchases({
        onlyIncludeActiveItemsIOS: true,
      });

      if (!purchases || purchases.length === 0) {
        Alert.alert('提示', '未找到可恢复的订阅');
        return;
      }

      const latest = purchases[0];
      let transactionJws = '';
      try {
        transactionJws = (await getTransactionJwsIOS(latest.productId)) ?? '';
      } catch {
        // ignore
      }

      let receiptData: string | undefined;
      if (!transactionJws) {
        try {
          receiptData = (await getReceiptDataIOS()) ?? undefined;
        } catch {
          // ignore
        }
      }

      if (!transactionJws && !receiptData) {
        Alert.alert('恢复失败', '无法获取交易凭证');
        return;
      }

      const result = await restorePurchase(
        user.id,
        transactionJws,
        receiptData,
      );

      if (result.code === 200) {
        await refreshAuth();
        Alert.alert('成功', '恢复完成');
      } else {
        Alert.alert('提示', '未找到可恢复的订阅');
      }
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
