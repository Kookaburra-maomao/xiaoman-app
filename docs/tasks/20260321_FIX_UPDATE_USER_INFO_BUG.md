# 修复更新用户信息导致数据丢失的 Bug

## 任务时间
2026-03-21

## Bug 描述
在设置页面更新头像后，用户的昵称变成了"用户"，再次更新头像时会报错"用户信息不存在"。

## 问题原因

### 根本原因
调用 `updateUserInfo` 时传递了不完整的用户对象，导致其他字段被覆盖为空值。

### 错误代码（更新头像）
```typescript
// ❌ 错误：只传递了部分字段，其他字段被设为空字符串
await updateUserInfo({
  avatar: avatarPath,
  id: '',        // 空字符串会覆盖原有 id
  username: ''   // 空字符串会覆盖原有 username
});
```

### 错误代码（更新昵称）
```typescript
// ❌ 错误：只传递了部分字段，其他字段丢失
await updateUserInfo({
  id: user.id,
  username: user.username,
  nick: trimmedNick,
  // 缺少 avatar, phone, is_vip 等其他字段
});
```

### 问题影响
1. **第一次更新头像**：
   - `id` 被设为空字符串
   - `username` 被设为空字符串
   - 昵称显示为"用户"（因为 `user?.nick || user?.username || '用户'`）
   - 其他字段（phone, is_vip 等）丢失

2. **第二次更新头像**：
   - 检查 `if (!user?.id)` 失败（因为 id 是空字符串）
   - 提示"用户信息不存在"

## 解决方案

### 修复方法
使用展开运算符保留原有用户信息，只更新需要修改的字段。

### 修复代码（更新头像）
```typescript
// ✅ 正确：保留原有信息，只更新头像
await updateUserInfo({
  ...user,           // 展开原有用户信息
  avatar: avatarPath, // 只更新头像字段
});
```

### 修复代码（更新昵称）
```typescript
// ✅ 正确：保留原有信息，只更新昵称
await updateUserInfo({
  ...user,            // 展开原有用户信息
  nick: trimmedNick,  // 只更新昵称字段
});
```

## 实施步骤

### 1. 修复 uploadAndUpdateAvatar 函数
**文件**: `app/settings.tsx`

```typescript
const uploadAndUpdateAvatar = async (imageUri: string) => {
  // ... 上传图片代码 ...

  // 更新用户信息（保留原有信息，只更新头像）
  await updateUserInfo({
    ...user,
    avatar: avatarPath,
  });

  Alert.alert('成功', '头像更新成功');
};
```

### 2. 修复 handleSaveNick 函数
**文件**: `app/settings.tsx`

```typescript
const handleSaveNick = async () => {
  // ... 验证代码 ...

  // 调用更新用户接口（保留原有信息，只更新昵称）
  await updateUserInfo({
    ...user,
    nick: trimmedNick,
  });

  Alert.alert('成功', '昵称更新成功');
};
```

## 完成情况
- ✅ 修复 `uploadAndUpdateAvatar` 函数
- ✅ 修复 `handleSaveNick` 函数
- ✅ 使用展开运算符保留原有用户信息
- ✅ TypeScript 类型检查通过

## 相关文件
- `app/settings.tsx` - 设置页面

## 技术细节

### updateUserInfo 函数签名
```typescript
updateUserInfo: (user: JwtUser) => Promise<void>
```

### JwtUser 接口定义
```typescript
export interface JwtUser {
  id: string;
  username: string;
  nick?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  is_vip?: string;
  vip_expire_time?: string;
  diary_secret?: string;
}
```

### 展开运算符的作用
```typescript
const user = {
  id: '123',
  username: 'user123',
  nick: '小明',
  avatar: '/old-avatar.jpg',
};

// 使用展开运算符
const updatedUser = {
  ...user,              // 复制所有字段
  avatar: '/new-avatar.jpg', // 覆盖 avatar 字段
};

// 结果：
// {
//   id: '123',
//   username: 'user123',
//   nick: '小明',
//   avatar: '/new-avatar.jpg', // 只有这个字段被更新
// }
```

## 测试验证

### 测试场景
1. **更新头像**
   - 上传新头像
   - 验证昵称保持不变
   - 验证其他信息（phone, is_vip 等）保持不变
   - 再次更新头像，验证不会报错

2. **更新昵称**
   - 修改昵称
   - 验证头像保持不变
   - 验证其他信息保持不变
   - 再次修改昵称，验证不会报错

3. **混合更新**
   - 先更新头像
   - 再更新昵称
   - 验证两个字段都正确更新
   - 验证其他字段保持不变

### 验证方法
1. 查看控制台日志
2. 检查用户信息显示
3. 验证 AsyncStorage 中的用户数据
4. 多次更新不同字段，确认数据完整性

## 经验教训

### 问题根源
- 没有理解 `updateUserInfo` 需要完整的用户对象
- 直接传递部分字段导致其他字段丢失
- 缺少对用户对象完整性的验证

### 最佳实践
1. **更新对象时使用展开运算符**
   ```typescript
   // ✅ 推荐
   await updateUserInfo({ ...user, field: newValue });
   
   // ❌ 避免
   await updateUserInfo({ field: newValue });
   ```

2. **验证必填字段**
   ```typescript
   if (!user?.id || !user?.username) {
     throw new Error('用户信息不完整');
   }
   ```

3. **类型安全**
   - 使用 TypeScript 接口定义
   - 确保传递的对象符合接口要求
   - 利用编译器检查类型错误

4. **防御性编程**
   - 在更新前验证数据完整性
   - 添加日志记录更新前后的数据
   - 提供回滚机制（如果更新失败）

## 预防措施

### 代码审查清单
- [ ] 更新用户信息时是否使用了展开运算符
- [ ] 是否保留了所有必填字段
- [ ] 是否验证了用户对象的完整性
- [ ] 是否添加了错误处理

### 单元测试建议
```typescript
describe('updateUserInfo', () => {
  it('should preserve all fields when updating avatar', async () => {
    const originalUser = {
      id: '123',
      username: 'user123',
      nick: '小明',
      avatar: '/old.jpg',
    };
    
    const updatedUser = {
      ...originalUser,
      avatar: '/new.jpg',
    };
    
    expect(updatedUser.id).toBe('123');
    expect(updatedUser.username).toBe('user123');
    expect(updatedUser.nick).toBe('小明');
    expect(updatedUser.avatar).toBe('/new.jpg');
  });
});
```

## 相关文档
- [AI 协作约定](../../AI_CONVENTIONS.md)
- [JWT 认证指南](../jwt/JWT_QUICK_REFERENCE.md)
- [JavaScript 展开运算符](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/Spread_syntax)

## 后续优化建议

1. **封装更新函数**
   ```typescript
   const updateUserField = async (field: keyof JwtUser, value: any) => {
     await updateUserInfo({
       ...user,
       [field]: value,
     });
   };
   ```

2. **添加数据验证**
   ```typescript
   const validateUserData = (user: JwtUser): boolean => {
     return !!(user.id && user.username);
   };
   ```

3. **添加更新日志**
   ```typescript
   console.log('[updateUserInfo] 更新前:', user);
   await updateUserInfo({ ...user, avatar: newAvatar });
   console.log('[updateUserInfo] 更新后:', updatedUser);
   ```

4. **使用 Partial 类型**
   ```typescript
   const updateUserPartial = async (updates: Partial<JwtUser>) => {
     await updateUserInfo({
       ...user,
       ...updates,
     });
   };
   ```
