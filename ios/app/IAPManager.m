// IAPManager 的 RCT 桥接
// Swift 类通过 @objc 暴露给 OC，不需要手动桥接

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(IAPManager, RCTEventEmitter)

RCT_EXTERN_METHOD(getProducts:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(purchase:(NSString *)productId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(restorePurchases:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getReceipt:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(finishTransaction:(NSString *)transactionIdentifier)

@end
