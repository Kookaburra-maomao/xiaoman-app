import { jwtGet, jwtPut } from '@/utils/jwtRequest';

export interface Letter {
  id: string;
  title: string;
  content: string;
  gmt_online: string;
  letter_version: number;
}

interface LetterListResponse {
  code: number;
  message: string;
  data: {
    list: Letter[];
    maxLetterVersion: number;
  };
}

export const getOnlineLetters = async (): Promise<{ list: Letter[]; maxLetterVersion: number }> => {
  const response = await jwtGet<LetterListResponse>('/api/xiaoman-letters/online');
  if (response.code === 200) return response.data;
  throw new Error(response.message || '获取来信列表失败');
};

export const markLettersRead = async (letterVersion: number): Promise<void> => {
  await jwtPut('/api/xiaoman-letters/read', { letter_version: letterVersion });
};
