# 日志打点实现状态

## 已实现的打点 ✅

### 对话Tab (8/11)
- ✅ 对话tab曝光 - `CHAT_TAB_EXPO`
- ✅ 输入框点击 - `INPUT_CLICK`
- ✅ 点击发送按钮 - `INPUT_SEND_BUTTON`
- ✅ 图片按钮点击 - `INPUT_IMAGE_BUTTON`
- ✅ 点击打开相册 - `INPUT_IMAGE_ALBUM`
- ✅ 点击打开相机 - `INPUT_IMAGE_CAMERA`
- ✅ 语音按钮点击 - `INPUT_VOICE_BUTTON`
- ✅ 结束录音并发送 - `INPUT_VOICE_RECORD_END`
- ✅ 松手取消录音 - `INPUT_VOICE_RECORD_CANCEL`
- ✅ 发送消息给模型 - `SEND_MESSAGE`
- ✅ 对话中点击生成日记 - `GENERATE_DIARY_BUTTON`

### 日记相关 (6/9)
- ✅ 日记预览页展现 - `DIARY_PREVIEW_EXPO`
- ✅ 日记生成完成 - `DIARY_GENERATE_COMPLETE`
- ✅ 日记预览页点击分享 - `DIARY_PREVIEW_SHARE`
- ✅ 日记预览页点击【保存日记图片】 - `DIARY_SAVE_IMAGE_SUCCESS`
- ✅ 点击编辑日记 - `DIARY_EDIT`
- ⏳ 日记预览页点击导出图片 - `DIARY_EXPORT_IMAGE` (与分享按钮相同)
- ⏳ 对话中展现日记卡片 - `DIARY_CARD_EXPO`
- ⏳ 日记卡片点击 - `DIARY_CARD_CLICK`

### 推荐计划 (0/5)
- ⏳ 对话中展示推荐计划 - `SUG_PLAN_EXPO`
- ⏳ 对话中点击【去添加计划】 - `SUG_PLAN_ADD`
- ⏳ 添加推荐计划预览页展现 - `SUG_PLAN_PREVIEW_EXPO`
- ⏳ 添加推荐计划预览页点击【修改】 - `SUG_PLAN_EDIT`
- ⏳ 添加推荐计划预览页点击【添加计划】 - `SUG_PLAN_ADD_CONFIRM`

### 计划Tab (1/8)
- ✅ 计划tab曝光 - `PLAN_TAB_EXPO`
- ⏳ 点击【新增计划】 - `PLAN_CREATE`
- ⏳ 新建计划浮层中点击【完成】 - `PLAN_CREATE_DONE`
- ⏳ 点击计划完成打卡 - `PLAN_DONE_CHECK`
- ⏳ 计划完成打卡浮层中点击上传图片 - `PLAN_DONE_CHECK_IMAGE`
- ⏳ 计划tab中点击【管理计划】 - `PLAN_MANAGE`
- ⏳ 管理计划页点击置顶某条计划 - `PLAN_SET_TOP`
- ⏳ 管理计划页点击某条计划查看详情 - `PLAN_DETAIL`

### 记录Tab (1/5)
- ✅ 记录tab曝光 - `RECORD_TAB_EXPO`
- ⏳ 点击某天进入记录复访落地页 - `RECORD_SINGLE_DAY`
- ⏳ 记录复访落地页展现 - `RECORD_REVIEW_EXPO`
- ⏳ 记录复访落地页点击复访某条日记 - `RECORD_REVIEW_DIARY`
- ⏳ 记录复访落地页点击查看对话记录 - `RECORD_REVIEW_CHAT`

### 设置页 (1/7)
- ✅ 设置&个人中心页面曝光 - `SETTING_PAGE_EXPO`
- ⏳ 点击开通会员 - `SETTING_GET_VIP`
- ⏳ 点击日记加密 - `SETTING_DIARY_LOCK`
- ⏳ 点击日夜间模式 - `SETTING_PAGE_MODE`
- ⏳ 点击最近删除 - `SETTING_RECENT_DELETE`
- ⏳ 点击关于小满 - `SETTING_ABOUT_ME`
- ⏳ 点击检查更新 - `SETTING_CHECK_UPDATE`

## 总体进度

- 已实现：18/45 (40%)
- 待实现：27/45 (60%)

## 需要添加打点的组件

### 高优先级
1. `components/chat/DiaryGenerateModal.tsx` - 日记预览页的分享、导出、编辑按钮
2. `components/chat/MessageItem.tsx` - 日记卡片的展现和点击
3. `components/chat/PlanList.tsx` - 推荐计划的展现和点击
4. `components/chat/PlanAddModal.tsx` - 添加推荐计划的操作

### 中优先级
5. `components/plan/PlanItem.tsx` - 计划打卡、管理等操作
6. `components/plan/PlanCreateModal.tsx` - 新建计划
7. `components/plan/PlanEditModal.tsx` - 编辑计划
8. `app/(tabs)/plan.tsx` - 计划tab的新增、管理按钮

### 低优先级
9. `app/(tabs)/record.tsx` - 记录tab的日历点击
10. `app/chat-record-day.tsx` - 记录复访落地页
11. `app/settings.tsx` - 设置页的各项操作按钮

## 实现建议

### 1. 日记相关打点
在 `components/chat/DiaryGenerateModal.tsx` 中：
- 分享按钮点击时调用 `log('DIARY_PREVIEW_SHARE')`
- 保存图片成功时调用 `log('DIARY_SAVE_IMAGE_SUCCESS')`
- 导出图片点击时调用 `log('DIARY_EXPORT_IMAGE')`
- 编辑按钮点击时调用 `log('DIARY_EDIT')`

### 2. 日记卡片打点
在 `components/chat/MessageItem.tsx` 中：
- 日记卡片渲染时调用 `log('DIARY_CARD_EXPO')`
- 日记卡片点击时调用 `log('DIARY_CARD_CLICK')`

### 3. 推荐计划打点
在 `components/chat/PlanList.tsx` 和 `PlanAddModal.tsx` 中：
- 推荐计划渲染时调用 `log('SUG_PLAN_EXPO')`
- 点击去添加时调用 `log('SUG_PLAN_ADD')`
- 预览页展现时调用 `log('SUG_PLAN_PREVIEW_EXPO')`
- 点击修改时调用 `log('SUG_PLAN_EDIT')`
- 点击添加时调用 `log('SUG_PLAN_ADD_CONFIRM')`

### 4. 计划Tab打点
在 `app/(tabs)/plan.tsx` 和相关组件中：
- 新增计划按钮点击时调用 `log('PLAN_CREATE')`
- 完成按钮点击时调用 `log('PLAN_CREATE_DONE')`
- 打卡按钮点击时调用 `log('PLAN_DONE_CHECK')`
- 上传图片点击时调用 `log('PLAN_DONE_CHECK_IMAGE')`
- 管理计划点击时调用 `log('PLAN_MANAGE')`
- 置顶操作时调用 `log('PLAN_SET_TOP')`
- 查看详情时调用 `log('PLAN_DETAIL')`

### 5. 记录Tab打点
在 `app/(tabs)/record.tsx` 和 `app/chat-record-day.tsx` 中：
- 日历日期点击时调用 `log('RECORD_SINGLE_DAY')`
- 复访页面展现时调用 `log('RECORD_REVIEW_EXPO')`
- 点击日记时调用 `log('RECORD_REVIEW_DIARY')`
- 查看对话记录时调用 `log('RECORD_REVIEW_CHAT')`

### 6. 设置页打点
在 `app/settings.tsx` 中：
- 开通会员点击时调用 `log('SETTING_GET_VIP')`
- 日记加密点击时调用 `log('SETTING_DIARY_LOCK')`
- 日夜间模式点击时调用 `log('SETTING_PAGE_MODE')`
- 最近删除点击时调用 `log('SETTING_RECENT_DELETE')`
- 关于小满点击时调用 `log('SETTING_ABOUT_ME')`
- 检查更新点击时调用 `log('SETTING_CHECK_UPDATE')`

## 使用示例

```typescript
import { useLog } from '@/hooks/useLog';

export default function MyComponent() {
  const { log } = useLog();
  
  const handleClick = () => {
    log('POSITION_KEY'); // 基本用法
    log('POSITION_KEY', { extra: 'info' }); // 带额外信息
  };
}
```

## 注意事项

1. 所有打点都是异步的，不会阻塞主流程
2. 打点失败会静默处理，不影响用户体验
3. 曝光类打点（expo）应该在组件渲染时调用
4. 点击类打点（click）应该在用户操作时调用
5. 成功类打点（success）应该在操作成功后调用
