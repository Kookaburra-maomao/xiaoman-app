/**
 * IAP 内购服务
 * 使用 react-native-iap
 */
import { post } from '@/utils/request';

// 苹果商品 ID
export const PRODUCT_IDS = {
  monthly: 'com.xiaomanriji.vip.monthly',
  quarterly: 'com.xiaomanriji.vip.quarterly',
};

export const APPLE_VIP_PLANS = [
  {
    id: 'monthly',
    productId: PRODUCT_IDS.monthly,
    name: '连续包月',
    price: 6,
    originalPrice: 12,
    discount: '立省50%',
    isNew: true,
  },
  {
    id: 'quarterly',
    productId: PRODUCT_IDS.quarterly,
    name: '连续包季',
    price: 18,
    originalPrice: 36,
    discount: '立省50%',
    isNew: false,
  },
];

/**
 * 验证收据并激活会员
 */
export async function verifyPurchase(userId: string, receiptData: string) {
  return post('/api/iap/verify', { userId, receiptData });
}

/**
 * 恢复购买
 */
export async function restorePurchase(userId: string, receiptData: string) {
  return post('/api/iap/restore', { userId, receiptData });
}
