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
  formData.append('image', {
    uri: imageUri,
    name: filename,
    type: type,
  } as any);

  // 上传图片
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
    headers: {
      'Content-Type': 'multipart/form-data',
    },
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
  const response = await fetch(`${apiUrl}/api/asr`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_url: fileUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || '语音识别失败');
  }

  const result = await response.json();
  
  if (result.code === 200 && result.data?.text) {
    return result.data.text;
  } else {
    throw new Error(result.message || '语音识别失败');
  }
};

