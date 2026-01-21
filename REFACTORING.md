# 代码重构计划

## 目录结构

```
xiaoman-app/
├── app/                    # 页面文件（只包含页面DOM和必要逻辑）
├── components/             # 组件
│   ├── plan/              # 计划相关组件
│   ├── chat/              # 对话相关组件
│   └── common/            # 通用组件
├── services/              # API服务层
├── hooks/                 # 自定义hooks
├── utils/                 # 工具函数
├── types/                 # 类型定义
└── constants/             # 常量
```

## 已完成的抽取

### 工具函数
- ✅ `utils/date-utils.ts` - 日期相关工具函数
- ✅ `utils/plan-utils.ts` - 计划计算相关工具函数（已存在）

### 类型定义
- ✅ `types/plan.ts` - 计划相关类型
- ✅ `types/chat.ts` - 对话相关类型

### 常量
- ✅ `constants/plan.ts` - 计划相关常量（CYCLE_MAP, MOOD_ICONS等）

### 服务层
- ✅ `services/planService.ts` - 计划相关API
- ✅ `services/chatService.ts` - 对话相关API
- ✅ `services/imageService.ts` - 图片/音频上传API

## 待抽取的组件

### 计划相关组件
- [ ] `components/plan/PlanItem.tsx` - 计划列表项
- [ ] `components/plan/PlanCreateModal.tsx` - 创建计划弹窗
- [ ] `components/plan/PlanSuccessModal.tsx` - 打卡成功弹窗
- [ ] `components/plan/DatePicker.tsx` - 日期选择器
- [ ] `components/plan/CyclePicker.tsx` - 周期选择器

### 对话相关组件
- [ ] `components/chat/MessageList.tsx` - 消息列表
- [ ] `components/chat/MessageItem.tsx` - 消息项
- [ ] `components/chat/MoodCard.tsx` - 心情卡片
- [ ] `components/chat/ChatInput.tsx` - 输入框组件
- [ ] `components/chat/ChatHeader.tsx` - 对话头部

### 通用组件
- [ ] `components/common/Calendar.tsx` - 日历组件
- [ ] `components/common/SearchBar.tsx` - 搜索框

## 待创建的自定义Hooks

- [ ] `hooks/usePlan.ts` - 计划相关状态和逻辑
- [ ] `hooks/useChat.ts` - 对话相关状态和逻辑
- [ ] `hooks/useTypewriter.ts` - 打字机效果
- [ ] `hooks/useRecording.ts` - 录音功能
- [ ] `hooks/useImagePicker.ts` - 图片选择

## 重构步骤

1. ✅ 创建目录结构和基础文件
2. ✅ 抽取工具函数和类型定义
3. ✅ 创建服务层
4. [ ] 创建自定义Hooks
5. [ ] 创建组件
6. [ ] 重构页面文件使用新的组件和hooks

