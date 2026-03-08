/**
 * 图片相关API服务
 */

const apiUrl = process.env.EXPO_PUBLIC_XIAOMAN_API_URL || '';

export interface ImageUploadResult {
  url: string;
  filename: string;
  originalname: string;
  size: number;
  compressedSize?: number;
}

// 上传图片
export const uploadImage = async (imageUri: string): Promise<ImageUploadResult> => {
  // 创建 FormData
  const formData = new FormData();
  
  // 获取文件名和类型
  const filename = imageUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';
  
  // 添加图片到 FormData
  const fileData = {
    uri: imageUri,
    name: filename,
    type: type,
  };
  formData.append('image', fileData as any);

  // 上传图片
  try {
    const response = await fetch(`${apiUrl}/api/upload/image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || '上传失败');
    }

    const result = await response.json();
    
    if (result.code === 200) {
      return {
        url: `${apiUrl}${result.data.url}`,
        filename: result.data.filename,
        originalname: result.data.originalname,
        size: result.data.size,
        compressedSize: result.data.compressedSize,
      };
    } else {
      throw new Error(result.message || '上传失败');
    }
  } catch (error: any) {
    console.error('[uploadImage] 上传失败:', error.message);
    throw error;
  }
};

// 上传音频
export const uploadAudio = async (audioUri: string): Promise<{ url: string }> => {
  // 创建 FormData
  const formData = new FormData();
  
  // 获取文件名和类型
  const filename = audioUri.split('/').pop() || 'recording.m4a';
  const fileType = filename.endsWith('.m4a') ? 'audio/m4a' : 'audio/mpeg';
  
  // 添加音频到 FormData
  formData.append('audio', {
    uri: audioUri,
    type: fileType,
    name: filename,
  } as any);

  // 上传音频
  const response = await fetch(`${apiUrl}/api/upload/audio`, {
    method: 'POST',
    body: formData,
    // 不要设置 Content-Type，让浏览器自动处理 multipart/form-data 的 boundary
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '上传失败');
  }

  const result = await response.json();
  
  if (result.code === 200) {
    return {
      url: result.data.url, // 返回相对路径，调用方需要拼接完整URL
    };
  } else {
    throw new Error(result.message || '上传失败');
  }
};

// ASR语音识别
export const callASR = async (fileUrl: string): Promise<string> => {
  const response = await fetch(`${apiUrl}/api/asr/doubao`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_url: fileUrl,
    }),
  });
  console.log("body:", JSON.stringify({
      file_url: fileUrl,
    }))
  const result = await response.json();

  // 检查响应状态
  if (!response.ok) {
    // HTTP 错误（4xx, 5xx）- 服务端返回 error 字段
    const errorMessage = result.error || '语音识别失败';
    // 检查是否是静音音频错误
    if (errorMessage.includes('静音') || errorMessage.includes('silent') || errorMessage.includes('无声')) {
      // 静音音频，返回空字符串，不抛出错误
      return '';
    }
    throw new Error(errorMessage);
  }

  // 检查业务状态码
  if (result.code === 200 && result.data?.text) {
    return result.data.text;
  } else {
    // 业务逻辑错误 - 服务端返回 message 字段
    const errorMessage = result.message || '语音识别失败';
    // 检查是否是静音音频错误
    if (errorMessage.includes('静音') || errorMessage.includes('silent') || errorMessage.includes('无声')) {
      // 静音音频，返回空字符串，不抛出错误
      return '';
    }
    throw new Error(errorMessage);
  }
};
