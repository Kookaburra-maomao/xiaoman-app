# 待完成打点日志清单

## 📊 总体进度：32/45 (71.1%)

---

## ⏳ 记录Tab操作：1/5 (20%)

### 待实现（4个）

#### 1. `RECORD_SINGLE_DAY` - 点击某天进入记录复访落地页
- **文件位置**: `app/(tabs)/record.tsx`
- **触发时机**: 点击日历某一天时
- **函数**: `handleDayPress(day: number | null)` (第 438-447 行)
- **实现方式**:
  ```typescript
  const handleDayPress = (day: number | null) => {
    if (day === null) return;
    
    // 添加打点
    log('RECORD_SINGLE_DAY');
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    router.push({
      pathname: '/record-detail',
      params: {
        date: dateStr,
      },
    });
  };
  ```
- **注意**: 需要先导入 `useLog` hook（已在第 54 行导入但有错误提示）

---

#### 2. `RECORD_REVIEW_EXPO` - 记录复访落地页展现
- **文件位置**: `app/chat-record-day.tsx`
- **触发时机**: 页面加载时（useFocusEffect）
- **实现位置**: 在 `useEffect` 或 `useFocusEffect` 中添加
- **实现方式**:
  ```typescript
  import { useLog } from '@/hooks/useLog';
  
  export default function DayChatRecordScreen() {
    const { log } = useLog();
    
    // 页面曝光打点
    useFocusEffect(
      useCallback(() => {
        log('RECORD_REVIEW_EXPO');
      }, [])
    );
  }
  ```

---

#### 3. `RECORD_REVIEW_DIARY` - 记录复访落地页点击复访某条日记
- **文件位置**: `app/chat-record-day.tsx`
- **触发时机**: 点击日记项时
- **实现位置**: 需要在 `renderMessage` 函数中添加点击事件
- **当前状态**: 该页面只展示对话记录，没有日记项点击功能
- **实现方式**: 需要先确认是否有日记项的点击跳转功能，如果有则在点击处理函数中添加：
  ```typescript
  const handleDiaryClick = (diaryId: string) => {
    log('RECORD_REVIEW_DIARY');
    // 跳转到日记详情
  };
  ```

---

#### 4. `RECORD_REVIEW_CHAT` - 记录复访落地页点击查看对话记录
- **文件位置**: `app/chat-record-day.tsx`
- **触发时机**: 点击查看对话记录按钮时
- **当前状态**: 该页面本身就是对话记录页面，可能需要确认是否有"查看对话记录"按钮
- **实现方式**: 如果有按钮，在点击处理函数中添加：
  ```typescript
  const handleViewChatHistory = () => {
    log('RECORD_REVIEW_CHAT');
    // 相关逻辑
  };
  ```

---

## ⏳ 设置页操作：1/7 (14.3%)

### 已完成（1个）
- ✅ `SETTING_PAGE_EXPO` - 设置&个人中心页面曝光（第 72 行）

### 待实现（6个）

#### 5. `SETTING_GET_VIP` - 点击开通会员
- **文件位置**: `app/settings.tsx`
- **触发时机**: 点击开通会员按钮时
- **当前状态**: 会员推广横幅已被注释（第 329-382 行）
- **实现位置**: 如果恢复会员功能，在按钮点击处添加
- **实现方式**:
  ```typescript
  <TouchableOpacity
    style={styles.membershipButton}
    activeOpacity={0.7}
    onPress={() => {
      log('SETTING_GET_VIP');
      router.push('/vip-center');
    }}
  >
  ```

---

#### 6. `SETTING_DIARY_LOCK` - 点击日记加密
- **文件位置**: `app/settings.tsx`
- **触发时机**: 点击日记加密开关时
- **当前状态**: 日记加密功能已被注释（第 384-399 行）
- **实现位置**: 在 `onDiaryEncryptionChange` 函数中添加
- **实现方式**:
  ```typescript
  const onDiaryEncryptionChange = useCallback(
    async (value: boolean) => {
      if (!user?.id) return;
      
      // 添加打点
      log('SETTING_DIARY_LOCK');
      
      try {
        setUpdatingDiarySecret(true);
        await updateUserInfo({ diary_secret: value ? 'true' : 'false' });
        setDiaryEncryptionEnabled(value);
      } catch (e: any) {
        Alert.alert('错误', e?.message || '更新失败，请重试');
      } finally {
        setUpdatingDiarySecret(false);
      }
    },
    [user?.id, updateUserInfo]
  );
  ```

---

#### 7. `SETTING_PAGE_MODE` - 点击日夜间模式
- **文件位置**: `app/settings.tsx`
- **触发时机**: 点击日夜间模式选项时
- **实现位置**: 在 `handleThemeChange` 函数中添加（第 95-104 行）
- **实现方式**:
  ```typescript
  const handleThemeChange = async (theme: 'system' | 'dark' | 'light') => {
    if (!user?.id) return;
    
    // 添加打点
    log('SETTING_PAGE_MODE');
    
    try {
      await updateUserInfo({ theme });
      setCurrentTheme(theme);
      setShowThemeMenu(false);
    } catch (error: any) {
      Alert.alert('错误', error?.message || '更新主题失败，请重试');
    }
  };
  ```

---

#### 8. `SETTING_RECENT_DELETE` - 点击最近删除
- **文件位置**: `app/settings.tsx`
- **触发时机**: 点击最近删除按钮时
- **实现位置**: 第 437-448 行的 TouchableOpacity
- **实现方式**:
  ```typescript
  <TouchableOpacity 
    style={styles.settingItem} 
    activeOpacity={0.7}
    onPress={() => {
      log('SETTING_RECENT_DELETE');
      router.push('/diary-recycle-bin');
    }}
  >
  ```

---

#### 9. `SETTING_ABOUT_ME` - 点击关于小满
- **文件位置**: `app/settings.tsx`
- **触发时机**: 点击关于小满按钮时
- **实现位置**: 第 465-476 行的 TouchableOpacity
- **实现方式**:
  ```typescript
  <TouchableOpacity 
    style={styles.settingItem} 
    activeOpacity={0.7}
    onPress={() => {
      log('SETTING_ABOUT_ME');
      // 跳转到关于页面或显示关于信息
    }}
  >
  ```

---

#### 10. `SETTING_CHECK_UPDATE` - 点击检查更新
- **文件位置**: `app/settings.tsx`
- **触发时机**: 点击检查更新按钮时
- **实现位置**: 第 452-463 行的 TouchableOpacity
- **实现方式**:
  ```typescript
  <TouchableOpacity 
    style={styles.settingItem} 
    activeOpacity={0.7}
    onPress={() => {
      log('SETTING_CHECK_UPDATE');
      // 检查更新逻辑
    }}
  >
  ```

---

## 🔍 其他待确认项（3个）

### 11. `DIARY_EXPORT_IMAGE` - 日记预览页点击导出图片
- **文件位置**: `components/diary/DiaryActionButtons.tsx`
- **当前状态**: 已有 `DIARY_PREVIEW_SHARE` 打点，需确认是否需要单独的导出打点
- **实现位置**: 第 50-68 行的导出按钮 `onPress={onExport}`

### 12-13. 重复定义项
- 原始需求中有两个"记录复访落地页展现"，spma/spmb 不同：
  - 第一个：`spma: "plan", spmb: "record_review"`
  - 第二个：`spma: "plan", spmb: "record_tab"`
- 需要与产品确认是否需要两个不同的打点

---

## 📝 实现注意事项

### 通用规则
1. 所有组件需要导入 `useLog` hook：
   ```typescript
   import { useLog } from '@/hooks/useLog';
   const { log } = useLog();
   ```

2. 曝光类打点（expo）在 `useEffect` 或 `useFocusEffect` 中调用
3. 点击类打点（click）在事件处理函数开头调用
4. 所有日志都是异步发送，不会阻塞主流程

### 特殊情况
- `app/(tabs)/record.tsx` 第 54 行已导入 `useLog` 但有错误提示，需要检查导入路径
- `app/chat-record-day.tsx` 需要添加 `useLog` 导入
- `app/settings.tsx` 第 29 行已导入 `useLog` 但有错误提示，需要检查

---

## 🎯 实现优先级

### 高优先级（常用功能）
1. 记录Tab操作（4个）- 用户查看历史记录的核心流程
2. 设置页操作（6个）- 用户设置和管理的常用功能

### 低优先级（待确认）
3. 其他功能（3个）- 需要与产品确认的重复或特殊项

---

## ✅ 下一步行动

1. 修复 `useLog` 导入错误
2. 实现记录Tab的4个打点
3. 实现设置页的6个打点
4. 与产品确认重复定义项和导出图片打点
