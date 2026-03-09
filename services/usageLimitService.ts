/**
 * 使用次数限制服务
 */

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

// 使用次数限制配置
export const USAGE_LIMITS = {
  CHAT: 100,    // 对话次数限制
  IMAGE: 5,     // 上传图片次数限制
  DIARY: 20,     // 生成日记次数限制
};

// 今日使用次数统计（所有类型）
export interface TodayCountAll {
  userId: string;
  date: string;
  total: number;
  byType: {
    chat: number;
    image: number;
    diary: number;
  };
}

// 今日使用次数统计（指定类型）
export interface TodayCountByType {
  userId: string;
  date: string;
  type: 'chat' | 'image' | 'diary';
  count: number;
}

/**
 * 查询今日使用次数（所有类型）
 */
export const getTodayCountAll = async (userId: string): Promise<TodayCountAll> => {
  const response = await fetch(`${apiUrl}/api/chat/today-count?userId=${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (result.code === 200) {
    return result.data;
  } else {
    throw new Error(result.message || '查询失败');
  }
};

/**
 * 查询今日使用次数（指定类型）
 */
export const getTodayCountByType = async (
  userId: string,
  type: 'chat' | 'image' | 'diary'
): Promise<number> => {
  const response = await fetch(`${apiUrl}/api/chat/today-count?userId=${userId}&type=${type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (result.code === 200) {
    return result.data.count;
  } else {
    throw new Error(result.message || '查询失败');
  }
};

/**
 * 检查是否超过使用限制
 * @returns { allowed: boolean, message?: string }
 */
export const checkUsageLimit = async (
  userId: string,
  type: 'chat' | 'image' | 'diary'
): Promise<{ allowed: boolean; message?: string; currentCount?: number; limit?: number }> => {
  try {
    const count = await getTodayCountByType(userId, type);
    
    let limit: number;
    let typeName: string;
    
    switch (type) {
      case 'chat':
        limit = USAGE_LIMITS.CHAT;
        typeName = '对话';
        break;
      case 'image':
        limit = USAGE_LIMITS.IMAGE;
        typeName = '上传图片';
        break;
      case 'diary':
        limit = USAGE_LIMITS.DIARY;
        typeName = '生成日记';
        break;
    }
    
    if (count >= limit) {
      return {
        allowed: false,
        message: `您今日的${typeName}次数已达上限（${limit}次），请明天再试`,
        currentCount: count,
        limit,
      };
    }
    
    return {
      allowed: true,
      currentCount: count,
      limit,
    };
  } catch (error: any) {
    console.error('检查使用限制失败:', error);
    // 如果检查失败，默认允许（避免影响用户体验）
    return {
      allowed: true,
      message: error.message,
    };
  }
};
