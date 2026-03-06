# 用户行为日志打点指南

## 概述

已实现用户行为日志打点功能，用于追踪用户在应用中的关键操作。日志会异步发送到后端，不会阻塞主流程。

## 使用方法

### 1. 使用 useLog Hook（推荐）

在组件中使用 `useLog` hook：

```typescript
import { useLog } from '@/hooks/useLog';

export default function MyComponent() {
  const { log } = useLog();
  
  // 在需要打点的地方调用
  const handleClick = () => {
    log('CHAT_TAB_EXPO'); // 使用预定义的位置key
    // 或者带额外信息
    log('DIARY_CARD_CLICK', { diaryId: '123', source: 'chat' });
  };
}
```

### 2. 直接使用 logService（不推荐，除非在非组件环境）

```typescript
import { logByPosition } from '@/services/logService';

// 需要手动传入 userId
logByPosition('CHAT_TAB_EXPO', userId);
logByPosition('DIARY_CARD_CLICK', userId, { diaryId: '123' });
```

## 已实现的打点位置

### 对话Tab
- ✅ `CHAT_TAB_EXPO` - 对话tab曝光
- ✅ `SEND_MESSAGE` - 发送消息给模型
- ✅ `GENERATE_DIARY_BUTTON` - 点击生成日记按钮
- ⏳ `INPUT_CLICK` - 输入框点击
- ⏳ `INPUT_SEND_BUTTON` - 点击发送按钮
- ⏳ `INPUT_IMAGE_BUTTON` - 图片按钮点击
- ⏳ `INPUT_IMAGE_ALBUM` - 点击打开相册
- ⏳ `INPUT_IMAGE_CAMERA` - 点击打开相机
- ⏳ `INPUT_VOICE_BUTTON` - 语音按钮点击
- ⏳ `INPUT_VOICE_RECORD_END` - 结束录音并发送
- ⏳ `INPUT_VOICE_RECORD_CANCEL` - 松手取消录音
- ⏳ `DIARY_CARD_EXPO` - 对话中展现日记卡片
- ⏳ `DIARY_CARD_CLICK` - 日记卡片点击

### 日记相关
- ✅ `DIARY_PREVIEW_EXPO` - 日记预览页展现
- ✅ `DIARY_GENERATE_COMPLETE` - 日记生成完成
- ⏳ `DIARY_PREVIEW_SHARE` - 日记预览页点击分享
- ⏳ `DIARY_SAVE_IMAGE_SUCCESS` - 保存日记图片成功
- ⏳ `DIARY_EXPORT_IMAGE` - 点击导出图片
- ⏳ `DIARY_EDIT` - 点击编辑日记

### 推荐计划
- ⏳ `SUG_PLAN_EXPO` - 对话中展示推荐计划
- ⏳ `SUG_PLAN_ADD` - 点击去添加计划
- ⏳ `SUG_PLAN_PREVIEW_EXPO` - 添加推荐计划预览页展现
- ⏳ `SUG_PLAN_EDIT` - 点击修改计划
- ⏳ `SUG_PLAN_ADD_CONFIRM` - 点击添加计划

### 计划Tab
- ✅ `PLAN_TAB_EXPO` - 计划tab曝光
- ⏳ `PLAN_CREATE` - 点击新增计划
- ⏳ `PLAN_CREATE_DONE` - 新建计划完成
- ⏳ `PLAN_DONE_CHECK` - 点击计划完成打卡
- ⏳ `PLAN_DONE_CHECK_IMAGE` - 打卡上传图片
- ⏳ `PLAN_MANAGE` - 点击管理计划
- ⏳ `PLAN_SET_TOP` - 置顶计划
- ⏳ `PLAN_DETAIL` - 查看计划详情

### 记录Tab
- ✅ `RECORD_TAB_EXPO` - 记录tab曝光
- ⏳ `RECORD_SINGLE_DAY` - 点击某天进入记录复访
- ⏳ `RECORD_REVIEW_EXPO` - 记录复访落地页展现
- ⏳ `RECORD_REVIEW_DIARY` - 复访某条日记
- ⏳ `RECORD_REVIEW_CHAT` - 查看对话记录

### 设置页
- ✅ `SETTING_PAGE_EXPO` - 设置页面曝光
- ⏳ `SETTING_GET_VIP` - 点击开通会员
- ⏳ `SETTING_DIARY_LOCK` - 点击日记加密
- ⏳ `SETTING_PAGE_MODE` - 点击日夜间模式
- ⏳ `SETTING_RECENT_DELETE` - 点击最近删除
- ⏳ `SETTING_ABOUT_ME` - 点击关于小满
- ⏳ `SETTING_CHECK_UPDATE` - 点击检查更新

## 添加新的打点位置

1. 在 `services/logService.ts` 的 `LOG_POSITIONS` 中添加新配置：

```typescript
export const LOG_POSITIONS = {
  // ... 现有配置
  MY_NEW_POSITION: {
    position: '新位置描述',
    spma: 'a位',
    spmb: 'b位',
    spmc: 'c位',
    spmd: 'd位',
    type: 'click' as const, // 或 'expo' 或 'success'
  },
};
```

2. 在需要的地方调用：

```typescript
log('MY_NEW_POSITION');
```

## 注意事项

1. 日志发送是异步的，不会阻塞主流程
2. 发送失败会静默处理，不影响用户体验
3. 曝光类打点（expo）通常放在 `useFocusEffect` 或 `useEffect` 中
4. 点击类打点（click）放在事件处理函数中
5. 成功类打点（success）放在操作成功的回调中

## API接口

### 创建单条日志
- 接口：`POST /api/user-logs`
- 参数：
  ```json
  {
    "type": "click",
    "spma": "chat",
    "spmb": "chat_tab",
    "spmc": "input",
    "spmd": "click",
    "extrinfo": "{\"page\":\"首页\"}",
    "user_id": "abc123"
  }
  ```

## 下一步工作

需要在以下组件中添加剩余的打点（标记为 ⏳ 的位置）：

1. `components/chat/ChatInput.tsx` - 输入框相关打点
2. `components/chat/MessageItem.tsx` - 消息卡片打点
3. `components/chat/PlanAddModal.tsx` - 推荐计划打点
4. `components/plan/PlanItem.tsx` - 计划操作打点
5. `components/diary/DiaryActionButtons.tsx` - 日记操作按钮打点
6. `app/settings.tsx` - 设置页面各项操作打点
7. 其他相关页面和组件
