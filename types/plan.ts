/**
 * 计划相关类型定义
 */

export interface PlanRecord {
  id: string;
  gmt_create: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  cycle: 'day' | 'week' | 'month' | 'year' | 'no';
  times: number;
  gmt_create: string;
  gmt_modified: string;
  gmt_limit?: string;
  is_top: string;
  user_id: string;
  state: string;
  records: PlanRecord[];
  image?: string; // 计划图片
}

export interface PlanKeepTime {
  key: string;
  times: number;
}

export interface PlansResponse {
  active: Plan[];
  finish: Plan[];
}

export interface CreatePlanForm {
  name: string;
  description?: string;
  cycle: 'day' | 'week' | 'month' | 'year' | 'no';
  times: number;
  gmt_limit: string;
  image?: string;
}

export interface SuccessModalData {
  totalTimes: number;
  planName: string;
  cycle: string;
  cycleType: 'day' | 'week' | 'month' | 'year' | 'no';
  finishTimes: number;
  times: number;
}

