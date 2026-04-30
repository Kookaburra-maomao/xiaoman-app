/**
 * 对话相关类型定义
 */

export interface Message {
  id: string;
  type: 'user' | 'system';
  text: string;
  imageUrl?: string;
  timestamp?: string; // 消息时间，格式 HH:mm
  isStreaming?: boolean; // 标记消息是否还在流式传输中
  isError?: boolean; // 标记消息是否为错误状态
  isVoiceLoading?: boolean; // 语音识别中的 loading 状态
  isImageLoading?: boolean; // 图片上传中的 loading 状态
  recordType?: 'chat' | 'image' | 'diary' | 'text' | 'emoji'; // 记录类型
  diaryData?: {
    id: string;
    context: string;
    pic?: string;
    gmt_create?: string; // 创建时间
  }; // 日记数据
  plans?: {
    plan_theme: string;
    plans: Array<{
      plan_name: string;
      plan_description: string;
      repeat: {
        repeat_unit: 'day' | 'week' | 'month' | 'year' | 'no';
        times_per_unit: number;
        plan_quality_score: number;
      };
    }>;
  }; // 计划数据
  plansProcessed?: boolean; // 标记计划是否已被处理（已保存）
}

export interface MoodIcon {
  id: number;
  label: string;
  icon: string;
}

