/**
 * 原生 IAP 模块封装
 * 桥接到 Swift IAPManager（直接调 StoreKit）
 */
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { IAPManager } = NativeModules;

const eventEmitter = IAPManager ? new NativeEventEmitter(IAPManager) : null;

// 商品 ID
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
 * 获取商品列表
 */
export async function getProducts() {
  if (Platform.OS !== 'ios') {
    throw new Error('IAP 仅支持 iOS');
  }
  if (!IAPManager) {
    throw new Error('IAP 模块未加载');
  }
  return IAPManager.getProducts();
}

/**
 * 购买商品
 */
export async function purchase(productId: string) {
  if (Platform.OS !== 'ios' || !IAPManager) {
    throw new Error('IAP 仅支持 iOS');
  }
  return IAPManager.purchase(productId);
}

/**
 * 恢复购买（返回收据 base64）
 */
export async function restorePurchases() {
  if (Platform.OS !== 'ios' || !IAPManager) {
    throw new Error('IAP 仅支持 iOS');
  }
  return IAPManager.restorePurchases();
}

/**
 * 获取本地收据 base64
 */
export async function getReceipt() {
  if (Platform.OS !== 'ios' || !IAPManager) {
    throw new Error('IAP 仅支持 iOS');
  }
  return IAPManager.getReceipt();
}

/**
 * 结束交易
 */
export function finishTransaction(transactionIdentifier: string) {
  if (Platform.OS !== 'ios' || !IAPManager) return;
  IAPManager.finishTransaction(transactionIdentifier);
}

/**
 * 监听购买更新
 */
export function addPurchaseUpdateListener(callback: (event: any) => void) {
  return eventEmitter?.addListener('onPurchaseUpdate', callback);
}

/**
 * 监听商品加载完成
 */
export function addProductsLoadedListener(callback: (event: any) => void) {
  return eventEmitter?.addListener('onProductsLoaded', callback);
}
