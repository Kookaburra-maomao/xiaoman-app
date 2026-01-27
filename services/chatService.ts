/**
 * 对话相关API服务
 */

import { CYCLE_MAP } from '@/constants/plan';
import { getAssistantHistory } from '@/utils/unread-messages';
import { fetchActivePlans } from './planService';

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 对话记录接口返回的数据结构
export interface ChatRecord {
  id: string;
  gmt_create: string;
  user_id: string;
  type: 'chat' | 'image' | 'diary' | 'text' | 'emoji';
  chat_from: 'user' | 'system';
  chat_context: string;
}

// 日记详情接口返回的数据结构
export interface DiaryDetail {
  id: string;
  gmt_create: string;
  gmt_modified: string;
  creator: string;
  context: string;
  pic?: string;
}

// 日记统计信息接口返回的数据结构
export interface DiaryCountItem {
  id: string;
  gmt_create: string;
  gmt_modified: string;
  diary_date: string;
  user_id: string;
  diary_count: number;
  emoji?: string;
  image_url?: string;
}

// 日期日记接口返回的数据结构
export interface DiaryByDateItem {
  id: string;
  gmt_create: string;
  gmt_modified: string;
  creator: string;
  context: string;
  pic?: string | null;
  emoji?: string | null;
}

// 解析流式响应的辅助函数
const parseStreamLine = (line: string) => {
  if (line.trim() && line.startsWith('data: ')) {
    const dataStr = line.slice(6).trim();
    
    if (dataStr === '[DONE]' || dataStr === '"[DONE]"') {
      return { done: true, token: null };
    }

    try {
      const data = JSON.parse(dataStr);
      return { done: false, token: data.token || null };
    } catch (e) {
      console.log('解析数据失败:', dataStr, e);
      return { done: false, token: null };
    }
  }
  return { done: false, token: null };
};

// 处理流式响应
const processStreamResponse = async (response: Response): Promise<string> => {
  let fullText = '';

  // 尝试使用 ReadableStream（如果可用）
  if (response.body && typeof response.body.getReader === 'function') {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let isDone = false;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一个不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = parseStreamLine(line);
          
          if (parsed.done) {
            isDone = true;
            break;
          }

          if (parsed.token) {
            fullText += parsed.token;
          }
        }

        if (isDone) {
          break;
        }
      }
    } catch (streamError) {
      console.warn('流式读取失败，尝试备用方法:', streamError);
      // 如果流式读取失败，使用备用方法
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        const parsed = parseStreamLine(line);
        
        if (parsed.done) {
          break;
        }

        if (parsed.token) {
          fullText += parsed.token;
        }
      }
    }
  } else {
    // 备用方法：直接读取完整响应然后解析
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      const parsed = parseStreamLine(line);
      
      if (parsed.done) {
        break;
      }

      if (parsed.token) {
        fullText += parsed.token;
      }
    }
  }

  return fullText;
};

// 发送聊天消息
export const sendChatMessage = async (
  userContent: string,
  userId: string,
  assistantHistory?: string[]
): Promise<string> => {
  const history = assistantHistory;

  const response = await fetch(`${apiUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userContent,
      assistantHistory: history,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error('请求失败');
  }

  return await processStreamResponse(response);
};

// 图片理解
export const callVL = async (
  imageUrl: string,
  userId: string,
  assistantHistory?: string[]
): Promise<string> => {
  // 确保 userHistory 是数组格式，如果未提供则从存储中获取
  const userHistory = assistantHistory || await getAssistantHistory();
  
  // 确保 userHistory 是数组，即使为空也是 []
  const historyArray = Array.isArray(userHistory) ? userHistory : [];
  
  try {
    const response = await fetch(`${apiUrl}/api/vl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        userHistory: historyArray,
        userId: userId,
      }),
    });

    // 先尝试读取响应文本，以便更好地处理错误
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = '图片理解失败';
      try {
        const errorData = JSON.parse(responseText);
        // 根据 API 响应格式，错误信息可能在 message 字段
        errorMessage = errorData?.message || errorData?.error || `请求失败 (${response.status})`;
      } catch {
        // 如果响应不是有效的 JSON，使用状态码和响应文本作为错误信息
        errorMessage = responseText || `请求失败 (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    // 解析响应 JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      console.error('响应解析失败:', responseText);
      throw new Error('响应解析失败');
    }

    // 根据 API 响应格式：{ code: 200, message: "视觉理解成功", data: { content: "..." } }
    if (result.code === 200 && result.data && result.data.content) {
      return result.data.content;
    } else {
      // 如果 code 不是 200 或没有 content，使用 message 字段作为错误信息
      const errorMsg = result.message || '图片理解失败';
      throw new Error(errorMsg);
    }
  } catch (error: any) {
    // 如果是我们抛出的错误，直接抛出
    if (error instanceof Error && error.message) {
      throw error;
    }
    // 其他错误，包装后抛出
    throw new Error(error?.message || '图片理解失败');
  }
};

// 生成日记（流式接口，支持回调）
export const generateDiary = async (
  userContent: string[],
  assistantHistory: string[],
  userId: string,
  onProgress?: (text: string) => void
): Promise<string> => {
  const response = await fetch(`${apiUrl}/api/diary/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userContent: userContent,
      assistantHistory: assistantHistory,
      userId: userId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '生成日记失败');
  }

  // 流式处理响应
  let fullText = '';
  
  if (response.body && typeof response.body.getReader === 'function') {
    try {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一个不完整的行
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            
            if (dataStr === '[DONE]' || dataStr === '"[DONE]"') {
              break;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                fullText += data.token;
                // 调用进度回调
                if (onProgress) {
                  onProgress(fullText);
                }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (streamError) {
      console.warn('流式读取失败，尝试备用方法:', streamError);
      // 如果流式读取失败，使用备用方法
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.trim() && line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          
          if (dataStr === '[DONE]' || dataStr === '"[DONE]"') {
            break;
          }

          try {
            const data = JSON.parse(dataStr);
            if (data.token) {
              fullText += data.token;
              if (onProgress) {
                onProgress(fullText);
              }
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } else {
    // 备用方法：直接读取完整响应然后解析
    const text = await response.text();
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.trim() && line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        
        if (dataStr === '[DONE]' || dataStr === '"[DONE]"') {
          break;
        }

        try {
          const data = JSON.parse(dataStr);
          if (data.token) {
            fullText += data.token;
            if (onProgress) {
              onProgress(fullText);
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  return fullText;
};

// 保存日记（新增或更新）
export const saveDiary = async (
  context: string,
  creator: string,
  pic?: string,
  emoji?: string,
  id?: string
): Promise<string> => {
  const response = await fetch(`${apiUrl}/api/diaries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      context: context,
      creator: creator,
      pic: pic || '',
      emoji: emoji || '',
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '保存日记失败');
  }

  const result = await response.json();

  if (result.code === 200 && result.data?.id) {
    return result.data.id;
  } else {
    throw new Error(result.message || '保存日记失败');
  }
};

// 更新日记
export const updateDiary = async (
  id: string,
  context: string,
  creator: string
): Promise<DiaryDetail> => {
  const response = await fetch(`${apiUrl}/api/diaries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: id,
      context: context,
      creator: creator,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '更新日记失败');
  }

  const result = await response.json();

  if (result.code === 200 && result.data) {
    return result.data;
  } else {
    throw new Error(result.message || '更新日记失败');
  }
};

// 保存对话记录
export const saveChatRecord = async (
  userId: string,
  type: 'chat' | 'image' | 'diary' | 'text' | 'emoji',
  chatFrom: 'user' | 'system',
  chatContext: string
): Promise<void> => {
  try {
    const response = await fetch(`${apiUrl}/api/chat/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        type: type,
        chat_from: chatFrom,
        chat_context: chatContext,
      }),
    });

    // 静默调用，不显示任何提示
    if (!response || !response.ok) {
      // 静默处理，不输出错误日志
      return;
    }
  } catch (error) {
    // 静默处理错误，不显示任何提示
    // 完全静默，不输出任何日志
  }
};

// 获取对话记录
export const getChatRecords = async (
  userId: string,
  startTime: string,
  endTime: string
): Promise<ChatRecord[]> => {
  const params = new URLSearchParams({
    user_id: userId,
    start_time: startTime,
    end_time: endTime,
  });

  const response = await fetch(`${apiUrl}/api/chat/records?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '获取对话记录失败');
  }

  const result = await response.json();

  if (result.code === 200 && Array.isArray(result.data)) {
    return result.data;
  } else {
    throw new Error(result.message || '获取对话记录失败');
  }
};

// 获取日记详情
export const getDiaryDetail = async (diaryId: string): Promise<DiaryDetail> => {
  const response = await fetch(`${apiUrl}/api/diaries/${diaryId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '获取日记详情失败');
  }

  const result = await response.json();

  if (result.code === 200 && result.data) {
    return result.data;
  } else {
    throw new Error(result.message || '获取日记详情失败');
  }
};

// 获取日记统计信息
export const getDiaryCount = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<DiaryCountItem[]> => {
  const params = new URLSearchParams({
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${apiUrl}/api/diaries/count?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '获取日记统计信息失败');
  }

  const result = await response.json();

  if (result.code === 200 && Array.isArray(result.data)) {
    return result.data;
  } else {
    throw new Error(result.message || '获取日记统计信息失败');
  }
};

// 获取指定日期的日记列表
export const getDiariesByDate = async (
  userId: string,
  date: string
): Promise<DiaryByDateItem[]> => {
  const params = new URLSearchParams({
    user_id: userId,
    date: date,
  });

  const response = await fetch(`${apiUrl}/api/diaries/dd?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '获取日期日记失败');
  }

  const result = await response.json();

  if (result.code === 200 && Array.isArray(result.data)) {
    return result.data;
  } else {
    throw new Error(result.message || '获取日期日记失败');
  }
};

// 删除日记
export const deleteDiary = async (diaryId: string): Promise<void> => {
  const response = await fetch(`${apiUrl}/api/diaries/${diaryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '删除日记失败');
  }

  const result = await response.json();

  if (result.code !== 200) {
    throw new Error(result.message || '删除日记失败');
  }
};

// 运营卡片接口返回的数据结构
export interface RecordItem {
  emoji: string;
  text: string;
}

export interface OperationCard {
  id: string;
  operational_position: string;
  operational_name: string;
  work_day: string;
  unwork_time: string;
  push_time: string;
  if_top: string;
  record_topic: string;
  record_item: RecordItem[]; // 数组类型
  button_name?: string;
  prompt_rule: string;
  topic_keyword: string;
  bg_image?: string;
  content_url?: string;
}

// 获取运营卡片列表
export const getOperationCards = async (): Promise<OperationCard[]> => {
  const params = new URLSearchParams({
    status: 'running',
    operational_position: 'home_card',
  });

  const response = await fetch(`${apiUrl}/api/operation-cards/all?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '获取运营卡片失败');
  }

  const result = await response.json();

  if (result.code === 200 && Array.isArray(result.data)) {
    return result.data;
  } else {
    throw new Error(result.message || '获取运营卡片失败');
  }
};

// 生成计划接口返回的数据结构
export interface GeneratedPlan {
  plan_name: string;
  plan_description: string;
  repeat: {
    repeat_unit: 'day' | 'week' | 'month' | 'year' | 'no';
    times_per_unit: number;
    plan_quality_score: number;
  };
}

export interface GeneratePlanResponse {
  plan_theme: string;
  plans: GeneratedPlan[];
}

// 生成计划
export const generatePlan = async (
  assistantHistory: string[],
  userId: string
): Promise<GeneratePlanResponse> => {
  // 获取用户的所有有效计划
  let activePlans: any[] = [];
  try {
    activePlans = await fetchActivePlans(userId);
  } catch (error) {
    console.error('获取有效计划失败:', error);
    // 静默处理错误，不影响生成计划的流程
  }

  // 格式化有效计划信息为字符串数组
  const plansHistory = activePlans.map(plan => {
    const cycleText = plan.cycle === 'no' || !plan.cycle 
      ? '不重复' 
      : `每${CYCLE_MAP[plan.cycle] || plan.cycle} ${plan.times}次`;
    const deadlineText = plan.gmt_limit ? `，截止日期：${plan.gmt_limit}` : '';
    return `计划：${plan.name}，${cycleText}${deadlineText}`;
  });

  // 过滤 assistantHistory，移除所有以 system: 开头的项
  const filteredUserContent = assistantHistory.filter(
    (item) => !item.startsWith('system:')
  );

  const response = await fetch(`${apiUrl}/api/chat/generate-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userContent: filteredUserContent, // 过滤后的 assistantHistory（移除 system: 开头的项）作为 userContent
      assistantHistory: plansHistory, // 有效计划列表作为 assistantHistory
      userId: userId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '生成计划失败');
  }

  const result = await response.json();

  if (result.code === 200 && result.data) {
    // 过滤计划：只保留 plan_quality_score >= 8 的计划
    const filteredData: GeneratePlanResponse = {
      ...result.data,
      plans: result.data.plans.filter(
        (plan: GeneratedPlan) => plan.repeat?.plan_quality_score >= 8
      ),
    };
    return filteredData;
  } else {
    throw new Error(result.message || '生成计划失败');
  }
};

