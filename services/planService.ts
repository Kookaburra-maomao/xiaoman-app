/**
 * 计划相关API服务
 */

import { get, post, put, del } from '@/utils/request';
import { Plan, PlansResponse, CreatePlanForm } from '@/types/plan';

// 获取活跃计划列表
export const fetchActivePlans = async (userId: string): Promise<Plan[]> => {
  const result = await get('/api/plans/active', { user_id: userId });
  if (result.code === 200) {
    return result.data || [];
  }
  throw new Error(result.message || '获取计划列表失败');
};

// 获取所有计划（包括已完成）
export const fetchAllPlans = async (userId: string): Promise<PlansResponse> => {
  const result = await get('/api/plans', { user_id: userId });
  if (result.code === 200) {
    return {
      active: result.data?.active || [],
      finish: result.data?.finish || [],
    };
  }
  throw new Error(result.message || '获取计划列表失败');
};

// 获取计划详情
export const fetchPlanDetail = async (planId: string): Promise<Plan> => {
  const result = await get(`/api/plans/${planId}`);
  if (result.code === 200) {
    return result.data;
  }
  throw new Error(result.message || '获取计划详情失败');
};

// 创建计划
export const createPlan = async (formData: CreatePlanForm & { user_id: string; description?: string }): Promise<string> => {
  const requestData: any = {
    name: formData.name.trim(),
    description: formData.description?.trim() || formData.name.trim(),
    user_id: formData.user_id,
    cycle: formData.cycle,
    times: formData.cycle === 'no' ? 0 : formData.times,
  };

  if (formData.gmt_limit) {
    // 格式化日期为 YYYY-MM-DD HH:mm:ss
    const date = new Date(formData.gmt_limit);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    requestData.gmt_limit = `${year}-${month}-${day} 23:59:59`;
  }

  // 如果有图片URL，添加到请求数据中
  if (formData.image) {
    requestData.image = formData.image;
  }

  const result = await post('/api/plans', requestData);
  if (result.code === 200) {
    return result.data.id;
  }
  throw new Error(result.message || '创建计划失败');
};

// 更新计划
export const updatePlan = async (planId: string, data: Partial<Plan>): Promise<void> => {
  const result = await put(`/api/plans/${planId}`, data);
  if (result.code !== 200) {
    throw new Error(result.message || '更新计划失败');
  }
};

// 删除计划
export const deletePlan = async (planId: string): Promise<void> => {
  const result = await del(`/api/plans/${planId}`);
  if (result.code !== 200) {
    throw new Error(result.message || '删除计划失败');
  }
};

// 创建计划记录（打卡）
export const createPlanRecord = async (planId: string): Promise<string> => {
  const result = await post('/api/plans/records', {
    plan_id: planId,
  });
  if (result.code === 200) {
    return result.data.id;
  }
  throw new Error(result.message || '打卡失败');
};

