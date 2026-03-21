# 添加注销用户功能

## 任务时间
2026-03-21

## 任务目标
在设置页面添加注销用户功能，允许用户注销账号，注销后清除所有本地数据并跳转到登录页。

## 需求说明
- 在设置页面"使用反馈"下方添加"注销用户"选项
- 文字颜色为红色（#FF3B30），表示危险操作
- 点击后弹出二次确认对话框
- 确认后调用后端注销接口
- 注销成功后清除本地缓存（JWT token、用户信息等）
- 跳转到登录页

## API 接口
```
POST /api/users/cancel

请求参数：
{
  userId: string  // 用户ID
}

响应：
{
  code: 200,
  message: "注销成功",
  data: {}
}
```

## 实施步骤

### 1. 添加 UI 按钮
在 `app/settings.tsx` 的设置组中添加注销用户选项：

```tsx
<TouchableOpacity 
  style={styles.settingItem} 
  activeOpacity={0.7}
  onPress={handleCancelAccount}
>
  <View style={styles.settingItemLeft}>
    <Image
      source={{ uri: 'http://xiaomanriji.com/api/files/xiaoman-setting-edit.png' }}
      style={styles.settingIcon}
      resizeMode="contain"
    />
    <Text style={[styles.settingItemText, { color: '#FF3B30' }]}>注销用户</Text>
  </View>
  <View style={styles.settingItemRight}>
    <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
  </View>
</TouchableOpacity>
```

### 2. 实现处理函数
添加 `handleCancelAccount` 函数：

```typescript
const handleCancelAccount = () => {
  Alert.alert(
    '注销账号',
    '注销后将无法恢复账号数据，确定要注销吗？',
    [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定注销',
        style: 'destructive',
        onPress: async () => {
          if (!user?.id) {
            Alert.alert('错误', '用户信息不存在');
            return;
          }

          try {
            // 调用注销接口
            const response = await fetch(`${apiUrl}/api/users/cancel`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
              }),
            });

            const result = await response.json();

            if (result.code === 200) {
              // 注销成功，清除本地数据并跳转到登录页
              await logout();
              Alert.alert('成功', '账号已注销', [
                {
                  text: '确定',
                  onPress: () => router.replace('/login'),
                },
              ]);
            } else {
              Alert.alert('错误', result.message || '注销失败，请重试');
            }
          } catch (error: any) {
            console.error('注销账号失败:', error);
            Alert.alert('错误', error.message || '注销失败，请重试');
          }
        },
      },
    ]
  );
};
```

## 完成情况
- ✅ 添加注销用户 UI 按钮
- ✅ 设置文字为红色（危险操作提示）
- ✅ 实现二次确认对话框
- ✅ 调用后端注销接口
- ✅ 注销成功后清除本地数据（通过 logout 函数）
- ✅ 跳转到登录页
- ✅ 错误处理和提示
- ✅ TypeScript 类型检查通过

## 相关文件
- `app/settings.tsx` - 设置页面

## 功能流程

### 用户操作流程
1. 用户进入设置页面
2. 滚动到底部，看到"注销用户"选项（红色文字）
3. 点击"注销用户"
4. 弹出确认对话框："注销后将无法恢复账号数据，确定要注销吗？"
5. 用户点击"确定注销"
6. 调用后端 API：`POST /api/users/cancel`
7. 后端将用户状态更新为 'cancel'
8. 前端收到成功响应
9. 调用 `logout()` 清除本地数据：
   - 清除 JWT token
   - 清除用户信息
   - 清除其他缓存数据
10. 显示"账号已注销"提示
11. 跳转到登录页

### 数据清除
通过调用 `logout()` 函数，会自动清除：
- JWT token（AsyncStorage: `@xiaoman_jwt_token`）
- 用户信息（AsyncStorage: `@xiaoman_jwt_user`）
- 认证上下文中的用户状态

### 错误处理
1. **用户信息不存在**：提示"用户信息不存在"
2. **网络请求失败**：提示"注销失败，请重试"
3. **后端返回错误**：显示后端返回的错误信息
4. **注销成功但跳转失败**：已清除数据，用户需要手动返回登录页

## 安全考虑

### 二次确认
- 使用 Alert.alert 弹出确认对话框
- 明确提示"注销后将无法恢复账号数据"
- 按钮样式为 'destructive'（红色），强调危险操作

### 数据清除
- 注销成功后立即清除所有本地数据
- 防止注销后仍能访问用户数据
- 使用 `router.replace()` 而非 `router.push()`，防止返回

### 后端验证
- 后端需要验证用户是否存在
- 后端需要验证用户是否已注销（防止重复注销）
- 后端需要验证请求的合法性（JWT token）

## UI 设计

### 按钮样式
- 位置：设置页面底部，"使用反馈"下方
- 图标：与其他设置项相同
- 文字：红色（#FF3B30），表示危险操作
- 右侧箭头：与其他设置项相同

### 确认对话框
- 标题："注销账号"
- 内容："注销后将无法恢复账号数据，确定要注销吗？"
- 按钮：
  - "取消"（默认样式）
  - "确定注销"（destructive 样式，红色）

### 成功提示
- 标题："成功"
- 内容："账号已注销"
- 按钮："确定"（点击后跳转到登录页）

## 测试建议

### 测试场景
1. **正常注销**：点击注销，确认，验证账号已注销
2. **取消注销**：点击注销，取消，验证账号未注销
3. **网络异常**：断网状态下注销，验证错误提示
4. **重复注销**：注销后再次尝试注销，验证后端拒绝
5. **数据清除**：注销后验证本地数据已清除
6. **页面跳转**：注销后验证跳转到登录页

### 测试步骤
1. 登录账号
2. 进入设置页面
3. 滚动到底部，找到"注销用户"
4. 点击"注销用户"
5. 验证弹出确认对话框
6. 点击"确定注销"
7. 验证显示加载状态
8. 验证显示"账号已注销"提示
9. 点击"确定"
10. 验证跳转到登录页
11. 验证无法使用原账号登录（或显示已注销）

### 验证方法
- 查看控制台日志
- 检查 AsyncStorage 数据
- 尝试访问需要登录的页面
- 检查后端数据库用户状态

## 注意事项

1. **不可逆操作**：注销后无法恢复，需要明确提示用户
2. **数据清除**：确保清除所有本地数据，防止隐私泄露
3. **页面跳转**：使用 `replace` 而非 `push`，防止返回
4. **错误处理**：网络异常时给出明确提示
5. **后端同步**：确保后端正确更新用户状态
6. **日志记录**：记录注销操作，便于问题排查

## 后续优化建议

1. **注销原因**：可以添加注销原因选择（可选）
2. **数据导出**：注销前提示用户导出数据
3. **冷静期**：设置注销冷静期（如7天），期间可以取消
4. **打点统计**：添加注销操作的打点统计
5. **邮件通知**：注销成功后发送邮件通知
6. **关联数据**：处理用户的关联数据（日记、计划等）

## 相关文档
- [AI 协作约定](../../AI_CONVENTIONS.md)
- [JWT 认证指南](../jwt/JWT_QUICK_REFERENCE.md)
