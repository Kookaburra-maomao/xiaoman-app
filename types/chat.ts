/**
 * 对话相关类型定义
 */

export interface Message {
  id: string;
  type: 'user' | 'system';
  text: string;
  imageUrl?: string;
  isStreaming?: boolean; // 标记消息是否还在流式传输中
  recordType?: 'chat' | 'image' | 'diary' | 'text' | 'emoji'; // 记录类型
  diaryData?: {
    id: string;
    context: string;
    pic?: string;
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
}

export interface MoodIcon {
  id: number;
  label: string;
  icon: string;
}

