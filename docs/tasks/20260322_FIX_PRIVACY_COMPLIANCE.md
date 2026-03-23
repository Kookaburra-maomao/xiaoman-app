# 修复隐私合规问题 - SDK 未同意收集

## 任务时间
2026-03-22

## 问题描述
**合规检测发现**：React Native 在用户同意隐私政策之前收集了以下个人信息：
- WiFi SSID（WiFi 名称）
- WiFi BSSID（WiFi MAC 地址）
- IP 地址

**违规时间**：2026-03-21 22:58:15

**违规原因**：
- `@react-native-community/netinfo` 在 app 启动时就初始化
- `JwtAuthContext` 在 `app/_layout.tsx` 中加载，早于用户同意隐私协议
- NetInfo 监听器在用户点击"同意"之前就开始收集网络信息

## 合规要求
1. 用户点击同意隐私政策之前，不应收集任何个人信息
2. 用户点击"不同意"、退出应用、查看隐私政策内容时，不应收集个人信息
3. 只有在用户点击"同意"后，SDK 才能初始化或执行系统接口调用

## 解决方案

### 1. 创建隐私同意管理工具
**文件**: `utils/privacyConsent.ts` (新建)

**功能**：
- `setPrivacyConsent(agreed: boolean)` - 保存用户同意状态
- `getPrivacyConsent()` - 获取用户同意状态
- `clearPrivacyConsent()` - 清除同意状态（退出登录时）

**实现**：
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_CONSENT_KEY = '@privacy_consent_agreed';

export const setPrivacyConsent = async (agreed: boolean): Promise<void> => {
  await AsyncStorage.setItem(PRIVACY_CONSENT_KEY, agreed ? 'true' : 'false');
  console.log('[Privacy] 隐私协议同意状态已保存:', agreed);
};

export const getPrivacyConsent = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(PRIVACY_CONSENT_KEY);
  return value === 'true';
};

export const clearPrivacyConsent = async (): Promise<void> => {
  await AsyncStorage.removeItem(PRIVACY_CONSENT_KEY);
  console.log('[Privacy] 隐私协议同意状态已清除');
};
```

### 2. 修改 NetInfo 初始化时机
**文件**: `contexts/JwtAuthContext.tsx` (修改)

**修改内容**：
- 导入 `getPrivacyConsent` 和 `clearPrivacyConsent`
- 在 NetInfo 监听器初始化前检查用户是否同意隐私协议
- 只有在用户同意后才初始化 NetInfo 监听
- 退出登录时清除隐私同意状态

**关键代码**：
```typescript
useEffect(() => {
  let unsubscribe: (() => void) | null = null;
  let previousIsConnected: boolean | null = null;
  
  const initNetworkListener = async () => {
    // 检查用户是否同意隐私协议
    const hasConsent = await getPrivacyConsent();
    
    if (!hasConsent) {
      console.log('[JWT Auth] 用户未同意隐私协议，跳过网络监听初始化');
      return;
    }
    
    console.log('[JWT Auth] 用户已同意隐私协议，初始化网络监听');
    
    unsubscribe = NetInfo.addEventListener((state) => {
      // 网络状态监听逻辑
    });
  };
  
  initNetworkListener();

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [user?.id]);
```

**退出登录时清除**：
```typescript
const handleLogout = useCallback(async () => {
  setUser(null);
  await jwtLogout();
  // 清除隐私协议同意状态
  await clearPrivacyConsent();
  console.log('[JWT Auth] 已清除隐私协议同意状态');
  await new Promise(resolve => setTimeout(resolve, 0));
}, []);
```

### 3. 登录时保存同意状态
**文件**: `app/login.tsx` (修改)

**修改内容**：
- 导入 `setPrivacyConsent`
- 在用户点击"同意"并登录成功前保存同意状态

**关键代码**：
```typescript
const handleVerify = async () => {
  // ... 验证逻辑

  if (!agreedToTerms) {
    Alert.alert('提示', '请先同意隐私协议和服务条款');
    return;
  }

  try {
    setVerifying(true);

    // 保存用户同意隐私协议的状态（在登录之前）
    await setPrivacyConsent(true);
    console.log('[Login] 用户已同意隐私协议，状态已保存');

    // 执行登录
    await login(trimmedPhone, trimmedCode);
    router.replace('/(tabs)/chat');
  } catch (error: any) {
    Alert.alert('错误', error.message || '登录失败，请重试');
  } finally {
    setVerifying(false);
  }
};
```

## 执行流程

### 首次启动（未同意隐私协议）
```
1. App 启动
2. JwtAuthContext 初始化
3. 检查隐私同意状态 → 未同意
4. 跳过 NetInfo 初始化 ✅
5. 显示登录页面
6. 用户勾选"同意隐私协议"
7. 用户点击登录
8. 保存同意状态
9. 执行登录
10. 初始化 NetInfo 监听 ✅
```

### 已登录用户（已同意隐私协议）
```
1. App 启动
2. JwtAuthContext 初始化
3. 检查隐私同意状态 → 已同意 ✅
4. 初始化 NetInfo 监听 ✅
5. 自动登录
6. 进入主页面
```

### 退出登录
```
1. 用户点击退出登录
2. 调用 logout()
3. 清除用户信息
4. 清除 JWT Token
5. 清除隐私同意状态 ✅
6. 跳转到登录页面
7. NetInfo 监听器停止 ✅
```

## 完成情况
- ✅ 创建隐私同意管理工具 (`utils/privacyConsent.ts`)
- ✅ 修改 NetInfo 初始化时机（只在用户同意后初始化）
- ✅ 登录时保存隐私同意状态
- ✅ 退出登录时清除隐私同意状态
- ✅ 注销账户时清除隐私同意状态（通过 logout）
- ✅ TypeScript 类型检查通过
- ✅ 添加详细日志输出

## 相关文件
- `utils/privacyConsent.ts` - 隐私同意管理工具（新建）
- `contexts/JwtAuthContext.tsx` - JWT 认证上下文（修改）
- `app/login.tsx` - 登录页面（修改）

## 测试验证

### 测试场景

1. **首次安装（未同意隐私协议）**
   - 安装 app 并启动
   - 检查日志：应该看到"用户未同意隐私协议，跳过网络监听初始化"
   - 使用抓包工具验证：不应有 WiFi 信息收集
   - 点击"同意"并登录
   - 检查日志：应该看到"用户已同意隐私协议，初始化网络监听"

2. **已登录用户（已同意隐私协议）**
   - 重启 app
   - 检查日志：应该看到"用户已同意隐私协议，初始化网络监听"
   - 验证网络监听功能正常

3. **退出登录**
   - 点击退出登录
   - 检查日志：应该看到"已清除隐私协议同意状态"
   - 重启 app
   - 检查日志：应该看到"用户未同意隐私协议，跳过网络监听初始化"

4. **注销账户**
   - 点击注销账户
   - 检查日志：应该看到"已清除隐私协议同意状态"
   - 重启 app
   - 验证隐私同意状态已清除

### 测试工具
- **抓包工具**：Charles、Fiddler、Wireshark
- **日志查看**：React Native Debugger、Flipper
- **合规检测**：第三方隐私合规检测工具

### 验证要点
1. 用户点击"同意"之前，不应有任何网络信息收集
2. 用户点击"不同意"或退出 app，不应有网络信息收集
3. 用户点击"同意"后，NetInfo 才开始工作
4. 退出登录后，下次启动不应自动收集网络信息

## 技术细节

### AsyncStorage 存储
- 使用 `@react-native-async-storage/async-storage` 持久化存储
- Key: `@privacy_consent_agreed`
- Value: `'true'` 或 `'false'`
- 退出登录时清除

### NetInfo 延迟初始化
- 使用 `async/await` 异步检查同意状态
- 只有在 `hasConsent === true` 时才调用 `NetInfo.addEventListener`
- 避免在 useEffect 外部直接调用 NetInfo

### 日志输出
- 所有关键步骤都有日志输出
- 便于调试和合规验证
- 生产环境可以通过配置关闭

## 注意事项

1. **首次启动体验**
   - 用户首次启动时，NetInfo 不会初始化
   - 网络状态监听功能在用户同意后才启用
   - 不影响登录功能（登录不依赖 NetInfo）

2. **网络恢复功能**
   - 只有在用户同意隐私协议后，网络恢复时才会自动刷新用户信息
   - 未同意时，网络恢复不会触发任何操作

3. **退出登录后**
   - 隐私同意状态会被清除
   - 下次登录需要重新同意
   - 符合隐私保护最佳实践

4. **其他 SDK**
   - 如果项目中还有其他收集个人信息的 SDK
   - 也需要采用类似的延迟初始化方案
   - 确保所有 SDK 都在用户同意后才初始化

## 后续优化建议

1. **统一 SDK 管理**
   - 创建 SDK 管理器，统一管理所有第三方 SDK 的初始化
   - 所有 SDK 都在用户同意后才初始化

2. **隐私政策弹窗**
   - 考虑在 app 首次启动时显示隐私政策弹窗
   - 用户必须同意后才能使用 app
   - 提供"不同意并退出"选项

3. **合规检测**
   - 定期使用第三方工具进行隐私合规检测
   - 确保所有个人信息收集都在用户同意后

4. **日志管理**
   - 生产环境可以关闭详细日志
   - 保留关键日志用于问题排查

## 相关法规
- 《个人信息保护法》
- 《网络安全法》
- 《App 违法违规收集使用个人信息行为认定方法》
- 工信部《App 用户权益保护测评规范》
