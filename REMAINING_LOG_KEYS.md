# 剩余待实现的打点 Key 列表

## 已完成（40/43）- 93.0%

**注：原需求45个打点，其中2个功能已删除（SETTING_GET_VIP、SETTING_DIARY_LOCK），实际需要实现43个**

### 对话Tab - 11个 ✅
1. ✅ `CHAT_TAB_EXPO` - 对话tab曝光
2. ✅ `INPUT_CLICK` - 输入框点击
3. ✅ `INPUT_SEND_BUTTON` - 点击发送按钮
4. ✅ `INPUT_IMAGE_BUTTON` - 图片按钮点击
5. ✅ `INPUT_IMAGE_ALBUM` - 点击打开相册
6. ✅ `INPUT_IMAGE_CAMERA` - 点击打开相机
7. ✅ `INPUT_VOICE_BUTTON` - 语音按钮点击
8. ✅ `INPUT_VOICE_RECORD_END` - 结束录音并发送
9. ✅ `INPUT_VOICE_RECORD_CANCEL` - 松手取消录音
10. ✅ `SEND_MESSAGE` - 发送消息给模型
11. ✅ `GENERATE_DIARY_BUTTON` - 对话中点击生成日记

### 日记相关 - 8个 ✅
12. ✅ `DIARY_PREVIEW_EXPO` - 日记预览页展现
13. ✅ `DIARY_GENERATE_COMPLETE` - 日记生成完成
14. ✅ `DIARY_PREVIEW_SHARE` - 日记预览页点击分享
15. ✅ `DIARY_SAVE_IMAGE_SUCCESS` - 日记预览页点击【保存日记图片】
16. ✅ `DIARY_EDIT` - 点击编辑日记
17. ✅ `DIARY_SHARE` - 点击分享日记
18. ✅ `DIARY_CARD_EXPO` - 对话中展现日记卡片
19. ✅ `DIARY_CARD_CLICK` - 日记卡片点击

### 推荐计划相关 - 5个 ✅
20. ✅ `SUG_PLAN_EXPO` - 对话中展示推荐计划
21. ✅ `SUG_PLAN_ADD` - 对话中点击【去添加计划】
22. ✅ `SUG_PLAN_PREVIEW_EXPO` - 添加推荐计划预览页展现
23. ✅ `SUG_PLAN_EDIT` - 添加推荐计划预览页点击【修改】
24. ✅ `SUG_PLAN_ADD_CONFIRM` - 添加推荐计划预览页点击【添加计划】

### 计划Tab操作 - 7个 ✅
25. ✅ `PLAN_TAB_EXPO` - 计划tab曝光
26. ✅ `PLAN_CREATE` - 点击【新增计划】
27. ✅ `PLAN_CREATE_DONE` - 新建计划浮层中点击【完成】
28. ✅ `PLAN_DONE_CHECK` - 点击计划完成打卡
29. ✅ `PLAN_DONE_CHECK_IMAGE` - 计划完成打卡浮层中点击上传图片
30. ✅ `PLAN_MANAGE` - 计划tab中点击【管理计划】
31. ✅ `PLAN_SET_TOP` - 管理计划页点击置顶某条计划
32. ✅ `PLAN_DETAIL` - 管理计划页点击某条计划查看详情

### 记录Tab操作 - 5个 ✅
33. ✅ `RECORD_TAB_EXPO` - 记录tab曝光
34. ✅ `RECORD_SINGLE_DAY` - 点击某天进入记录复访落地页
35. ✅ `RECORD_REVIEW_EXPO` - 记录复访落地页展现
36. ✅ `RECORD_REVIEW_DIARY` - 记录复访落地页点击复访某条日记
37. ✅ `RECORD_REVIEW_CHAT` - 记录复访落地页点击查看对话记录

### 设置页操作 - 5个 ✅
38. ✅ `SETTING_PAGE_EXPO` - 设置&个人中心页面曝光
39. ✅ `SETTING_CHECK_UPDATE` - 点击检查更新
40. ✅ `SETTING_ABOUT_ME` - 点击关于小满
41. ✅ `SETTING_RECENT_DELETE` - 点击最近删除
42. ✅ `SETTING_PAGE_MODE` - 点击日夜间模式

### 已删除功能（2个）❌
- ❌ `SETTING_GET_VIP` - 点击开通会员（功能已删除）
- ❌ `SETTING_DIARY_LOCK` - 点击日记加密（功能已删除）

---

## 待实现（3/43）- 7.0%

### 其他（3个）⏳ - 待产品确认
1. ⏳ `DIARY_EXPORT_IMAGE` - 日记预览页点击导出图片
    - 位置：`components/diary/DiaryActionButtons.tsx`
    - 触发时机：点击导出按钮时
    - 注：与分享功能类似，但是独立的导出操作
    - 当前状态：需要确认是否需要单独打点，还是与 DIARY_PREVIEW_SHARE 合并

2-3. ⏳ 待确认的重复项
    - 原始需求中存在重复的"记录复访落地页展现"定义
    - 第一个：spma: "plan", spmb: "record_review" (已实现为 RECORD_REVIEW_EXPO)
    - 第二个：spma: "plan", spmb: "record_tab" 
    - 需要与产品确认是否需要两个不同的打点

---

## 实现进度总结

### 总体进度：40/43 (93.0%)

### 各模块完成度：
- ✅ 对话Tab：11/11 (100%)
- ✅ 日记相关：8/8 (100%)
- ✅ 推荐计划：5/5 (100%)
- ✅ 计划Tab操作：7/7 (100%)
- ✅ 记录Tab操作：5/5 (100%)
- ✅ 设置页操作：5/5 (100%)
- ⏳ 其他：0/3 (0% - 待产品确认)

### 待确认清单（3个）：

**待产品确认（3个）：**
1. `DIARY_EXPORT_IMAGE` - 日记预览页点击导出图片（需确认是否需要单独打点）
2-3. 重复定义项需要与产品确认

---

## 🎉 核心功能打点已全部完成！

所有核心业务流程的打点已经100%实现：
- ✅ 对话功能完整覆盖
- ✅ 日记生成和管理完整覆盖
- ✅ 计划创建和管理完整覆盖
- ✅ 记录查看和复访完整覆盖
- ✅ 设置页面完整覆盖

剩余3个打点为边缘功能或重复定义，需要产品确认后再决定是否实现。

---

## 实现优先级建议

### ✅ 已完成
所有核心功能的打点已100%完成！

### 待产品确认（3个）
需要与产品确认是否需要实现：
1. `DIARY_EXPORT_IMAGE` - 是否需要单独的导出图片打点
2-3. 重复定义项 - 是否需要两个不同的记录复访页面曝光打点

---

## 使用方法

### 方式1：使用 useLog Hook（推荐）
适用于函数组件中：

```typescript
import { useLog } from '@/hooks/useLog';

function MyComponent() {
  const { log } = useLog();
  
  // 曝光打点
  useEffect(() => {
    log('PLAN_TAB_EXPO');
  }, []);
  
  // 点击打点
  const handleClick = () => {
    log('PLAN_CREATE');
    // 原有逻辑...
  };
}
```

### 方式2：直接使用 logByPosition
适用于需要传递 userId 的场景：

```typescript
import { logByPosition } from '@/services/logService';

// 曝光打点
useEffect(() => {
  if (userId) {
    logByPosition('PLAN_TAB_EXPO' as any, userId);
  }
}, [userId]);

// 点击打点
const handleClick = () => {
  if (userId) {
    logByPosition('PLAN_CREATE' as any, userId);
  }
  // 原有逻辑...
};
```

### 注意事项：
1. 所有日志都是异步发送，不会阻塞主流程
2. 曝光类打点（expo）应在 useEffect 中调用
3. 点击类打点（click）应在事件处理函数中调用
4. 成功类打点（success）应在操作成功后调用
5. 日志发送失败会静默处理，不影响用户体验
