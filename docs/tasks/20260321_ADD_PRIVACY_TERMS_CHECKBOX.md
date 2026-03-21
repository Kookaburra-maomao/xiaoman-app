# 添加隐私协议和服务条款勾选框

## 任务时间
2026-03-21

## 任务目标
在登录页面添加隐私协议和服务条款的勾选框，用户必须同意后才能登录。

## 需求说明
- 在登录框下方展示勾选框
- 文字内容：同意《隐私协议》和《服务条款》
- 隐私协议链接：http://xiaomanriji.com/privacy
- 服务条款链接：http://xiaomanriji.com/terms
- 点击链接在浏览器中打开
- 未勾选时登录按钮禁用

## 实施步骤

### 1. 添加状态管理
```typescript
const [agreedToTerms, setAgreedToTerms] = useState(false);
```

### 2. 导入 Linking API
```typescript
import { Linking } from 'react-native';
```

### 3. 添加打开链接函数
```typescript
const openLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('提示', '无法打开链接');
    }
  } catch (error) {
    console.error('打开链接失败:', error);
    Alert.alert('提示', '打开链接失败');
  }
};
```

### 4. 修改登录验证逻辑
在 `handleVerify` 函数中添加勾选检查：
```typescript
if (!agreedToTerms) {
  Alert.alert('提示', '请先同意隐私协议和服务条款');
  return;
}
```

### 5. 添加 UI 组件
在验证码输入框和登录按钮之间添加：
```tsx
<View style={styles.termsContainer}>
  <TouchableOpacity
    style={styles.checkbox}
    onPress={() => setAgreedToTerms(!agreedToTerms)}
  >
    <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxBoxChecked]}>
      {agreedToTerms && <Text style={styles.checkboxCheck}>✓</Text>}
    </View>
  </TouchableOpacity>
  <View style={styles.termsTextContainer}>
    <Text style={styles.termsText}>同意</Text>
    <TouchableOpacity onPress={() => openLink('http://xiaomanriji.com/privacy')}>
      <Text style={styles.termsLink}>《隐私协议》</Text>
    </TouchableOpacity>
    <Text style={styles.termsText}>和</Text>
    <TouchableOpacity onPress={() => openLink('http://xiaomanriji.com/terms')}>
      <Text style={styles.termsLink}>《服务条款》</Text>
    </TouchableOpacity>
  </View>
</View>
```

### 6. 修改登录按钮状态
```tsx
<TouchableOpacity
  style={[styles.submitButton, (verifying || !agreedToTerms) && styles.submitButtonDisabled]}
  onPress={handleVerify}
  disabled={verifying || !agreedToTerms}
>
```

### 7. 添加样式
```typescript
termsContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: scaleSize(16),
  marginBottom: scaleSize(8),
},
checkbox: {
  marginRight: scaleSize(8),
},
checkboxBox: {
  width: scaleSize(18),
  height: scaleSize(18),
  borderWidth: 1,
  borderColor: '#000000',
  borderRadius: scaleSize(4),
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#FAFAFA',
},
checkboxBoxChecked: {
  backgroundColor: '#000000',
},
checkboxCheck: {
  color: '#FFFFFF',
  fontSize: scaleSize(12),
  fontWeight: 'bold',
},
termsTextContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  flex: 1,
},
termsText: {
  fontSize: scaleSize(12),
  color: '#666666',
},
termsLink: {
  fontSize: scaleSize(12),
  color: '#000000',
  textDecorationLine: 'underline',
  marginHorizontal: scaleSize(2),
},
```

## 完成情况
- ✅ 添加勾选框状态管理
- ✅ 导入 Linking API
- ✅ 实现打开链接功能
- ✅ 添加勾选验证逻辑
- ✅ 实现 UI 组件
- ✅ 添加样式
- ✅ 修改登录按钮禁用逻辑
- ✅ TypeScript 类型检查通过

## 相关文件
- `app/login.tsx` - 登录页面

## 功能特性
1. 自定义勾选框样式（黑色边框，勾选后黑色背景）
2. 链接文字带下划线，点击在浏览器中打开
3. 未勾选时登录按钮禁用（透明度降低）
4. 点击登录时验证是否已勾选
5. 响应式布局，文字自动换行

## 注意事项
1. 链接使用 `Linking.openURL()` 在系统浏览器中打开
2. 添加了错误处理，链接打开失败时显示提示
3. 勾选框使用 TouchableOpacity 提供点击反馈
4. 登录按钮同时检查 `verifying` 和 `agreedToTerms` 状态

## 测试建议
1. 验证未勾选时无法点击登录按钮
2. 验证勾选后可以正常登录
3. 验证点击隐私协议链接能正常打开
4. 验证点击服务条款链接能正常打开
5. 验证勾选框的视觉反馈正常
6. 验证在不同屏幕尺寸下布局正常

## 相关文档
- [AI 协作约定](../../AI_CONVENTIONS.md)
