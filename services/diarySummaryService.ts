import { jwtGet, jwtPost } from '@/utils/jwtRequest';

export interface DiarySummary {
  id: string;
  gmt_create: string;
  gmt_modified: string;
  type: 'week' | 'month' | 'year';
  user_id: string;
  content: string;
  date_show: string;
}

interface ListResponse {
  code: number;
  message: string;
  data: DiarySummary[];
}

interface DetailResponse {
  code: number;
  message: string;
  data: DiarySummary;
}

export const getDiarySummaries = async (
  userId: string,
  type: 'week' | 'month' | 'year'
): Promise<DiarySummary[]> => {
  const response = await jwtGet<ListResponse>(
    `/api/diary-summaries?user_id=${userId}&type=${type}`
  );
  if (response.code === 200) return response.data;
  throw new Error(response.message || '获取日记总结失败');
};

export const getDiarySummaryDetail = async (id: string): Promise<DiarySummary> => {
  const response = await jwtGet<DetailResponse>(`/api/diary-summaries/${id}`);
  if (response.code === 200) return response.data;
  throw new Error(response.message || '获取日记总结详情失败');
};

export const clearReviewFlag = async (
  userId: string,
  type: 'week' | 'month' | 'year'
): Promise<void> => {
  await jwtPost('/api/users/clear-review-flag', { userId, type });
};
