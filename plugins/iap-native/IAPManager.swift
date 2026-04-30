import Foundation
import StoreKit

// 商品 ID
let MonthlyProductID = "com.xiaomanriji.vip.monthly"
let QuarterlyProductID = "com.xiaomanriji.vip.quarterly"
let ProductIDs: Set<String> = [MonthlyProductID, QuarterlyProductID]

/// IAP 管理器
@objc(IAPManager)
class IAPManager: RCTEventEmitter {
  
  private var products: [SKProduct] = []
  private var pendingPurchase: SKPaymentTransaction?
  
  // 必须重写，否则 bridge 不工作
  override static func moduleName() -> String! {
    return "IAPManager"
  }
  
  override func supportedEvents() -> [String]! {
    return ["onPurchaseUpdate", "onProductsLoaded"]
  }
  
  // MARK: - 获取商品列表
  
  @objc(getProducts:rejecter:)
  func getProducts(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let request = SKProductsRequest(productIdentifiers: ProductIDs)
    let delegate = ProductsRequestDelegate(resolve: resolve, reject: reject, manager: self)
    request.delegate = delegate
    request.start()
    
    // 保持引用防止被释放
    objc_setAssociatedObject(request, "delegate", delegate, .OBJC_ASSOCIATION_RETAIN)
  }
  
  // MARK: - 购买
  
  @objc(purchase:resolver:rejecter:)
  func purchase(_ productId: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let product = products.first(where: { $0.productIdentifier == productId }) else {
      reject("PRODUCT_NOT_FOUND", "商品不存在", nil)
      return
    }
    
    let payment = SKPayment(product: product)
    let delegate = PurchaseDelegate(resolve: resolve, reject: reject, manager: self)
    SKPaymentQueue.default().add(payment)
    
    objc_setAssociatedObject(payment, "delegate", delegate, .OBJC_ASSOCIATION_RETAIN)
  }
  
  // MARK: - 恢复购买
  
  @objc(restorePurchases:rejecter:)
  func restorePurchases(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let delegate = RestoreDelegate(resolve: resolve, reject: reject, manager: self)
    // 存到全局字典中
    IAPManager.restoreDelegates[ObjectIdentifier(delegate)] = delegate
    SKPaymentQueue.default().restoreCompletedTransactions()
  }
  
  // MARK: - 获取收据
  
  @objc(getReceipt:rejecter:)
  func getReceipt(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let receiptUrl = Bundle.main.appStoreReceiptURL else {
      reject("NO_RECEIPT", "没有收据", nil)
      return
    }
    
    do {
      let receiptData = try Data(contentsOf: receiptUrl)
      let receiptString = receiptData.base64EncodedString()
      resolve(receiptString)
    } catch {
      reject("RECEIPT_ERROR", "读取收据失败: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - 结束交易
  
  @objc(finishTransaction:)
  func finishTransaction(_ transactionIdentifier: String) {
    guard let transaction = findTransaction(identifier: transactionIdentifier) else { return }
    SKPaymentQueue.default().finishTransaction(transaction)
  }
  
  // MARK: - 帮助方法
  
  private func findTransaction(identifier: String) -> SKPaymentTransaction? {
    // 简单实现：从 pending 中找
    return pendingPurchase
  }
  
  // MARK: - 恢复代理存储
  
  private static var restoreDelegates: [ObjectIdentifier: RestoreDelegate] = [:]
  
  // MARK: - 更新到 JS
  
  func sendPurchaseEvent(transaction: SKPaymentTransaction, state: String) {
    sendEvent(withName: "onPurchaseUpdate", body: [
      "productId": transaction.payment.productIdentifier,
      "transactionIdentifier": transaction.transactionIdentifier ?? "",
      "state": state,
    ])
  }
}

// MARK: - Products Request Delegate

class ProductsRequestDelegate: NSObject, SKProductsRequestDelegate {
  let resolve: RCTPromiseResolveBlock
  let reject: RCTPromiseRejectBlock
  weak var manager: IAPManager?
  
  init(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, manager: IAPManager) {
    self.resolve = resolve
    self.reject = reject
    self.manager = manager
  }
  
  func productsRequest(_ request: SKProductsRequest, didReceive response: SKProductsResponse) {
    let products = response.products.map { product -> [String: Any] in
      let formatter = NumberFormatter()
      formatter.numberStyle = .currency
      formatter.locale = product.priceLocale
      
      return [
        "productId": product.productIdentifier,
        "price": product.price.doubleValue,
        "localizedPrice": formatter.string(from: product.price) ?? "\(product.price)",
        "title": product.localizedTitle,
        "description": product.localizedDescription,
      ]
    }
    
    manager?.products = response.products
    resolve(products)
  }
  
  func request(_ request: SKRequest, didFailWithError error: Error) {
    reject("PRODUCTS_ERROR", "获取商品列表失败: \(error.localizedDescription)", error)
  }
}

// MARK: - Purchase Delegate

class PurchaseDelegate: NSObject, SKPaymentTransactionObserver {
  let resolve: RCTPromiseResolveBlock
  let reject: RCTPromiseRejectBlock
  weak var manager: IAPManager?
  
  init(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, manager: IAPManager) {
    self.resolve = resolve
    self.reject = reject
    self.manager = manager
    super.init()
    SKPaymentQueue.default().add(self)
  }
  
  func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
    for transaction in transactions {
      switch transaction.transactionState {
      case .purchased:
        manager?.pendingPurchase = transaction
        resolve([
          "productId": transaction.payment.productIdentifier,
          "transactionIdentifier": transaction.transactionIdentifier ?? "",
          "state": "purchased",
        ])
        SKPaymentQueue.default().remove(self)
        manager?.sendPurchaseEvent(transaction: transaction, state: "purchased")
        
      case .failed:
        SKPaymentQueue.default().remove(self)
        if let error = transaction.error {
          if (error as NSError).code == SKError.paymentCancelled.rawValue {
            reject("E_USER_CANCELLED", "用户取消", error)
          } else {
            reject("PURCHASE_ERROR", error.localizedDescription, error)
          }
        } else {
          reject("PURCHASE_ERROR", "购买失败", nil)
        }
        
      case .restored:
        break
        
      case .deferred:
        break
        
      case .purchasing:
        break
        
      @unknown default:
        break
      }
    }
  }
  
  deinit {
    SKPaymentQueue.default().remove(self)
  }
}

// MARK: - Restore Delegate

class RestoreDelegate: NSObject, SKPaymentTransactionObserver {
  let resolve: RCTPromiseResolveBlock
  let reject: RCTPromiseRejectBlock
  weak var manager: IAPManager?
  
  init(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, manager: IAPManager) {
    self.resolve = resolve
    self.reject = reject
    self.manager = manager
    super.init()
    SKPaymentQueue.default().add(self)
  }
  
  func paymentQueue(_ queue: SKPaymentQueue, updatedTransactions transactions: [SKPaymentTransaction]) {
    // 恢复交易会触发 restored 事件
    for transaction in transactions {
      if transaction.transactionState == .restored {
        manager?.pendingPurchase = transaction
      }
    }
  }
  
  func paymentQueueRestoreCompletedTransactionsFinished(_ queue: SKPaymentQueue) {
    SKPaymentQueue.default().remove(self)
    // 获取收据
    if let receiptUrl = Bundle.main.appStoreReceiptURL,
       let receiptData = try? Data(contentsOf: receiptUrl) {
      resolve(receiptData.base64EncodedString())
    } else {
      reject("NO_RECEIPT", "没有可恢复的订阅", nil)
    }
  }
  
  func paymentQueue(_ queue: SKPaymentQueue, restoreCompletedTransactionsFailedWithError error: Error) {
    SKPaymentQueue.default().remove(self)
    reject("RESTORE_ERROR", error.localizedDescription, error)
  }
  
  deinit {
    SKPaymentQueue.default().remove(self)
  }
}
