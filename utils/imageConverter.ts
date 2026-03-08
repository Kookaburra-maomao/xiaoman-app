/**
 * 图片格式转换工具
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * 将 HEIC/HEIF 格式转换为 JPEG
 * @param uri 图片 URI
 * @returns 转换后的图片 URI（如果不是 HEIC/HEIF 则返回原 URI）
 */
export const convertHeicToJpeg = async (uri: string): Promise<string> => {
  const lowerUri = uri.toLowerCase();
  
  // 检查是否是 HEIC 或 HEIF 格式
  if (lowerUri.endsWith('.heic') || lowerUri.endsWith('.heif')) {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [], // 不做任何操作，只是转换格式
        { 
          compress: 0.9, // 90% 质量
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      return result.uri;
    } catch (error: any) {
      console.error('[convertHeicToJpeg] 转换失败:', error);
      throw new Error('图片格式转换失败，请选择其他图片');
    }
  }
  
  return uri;
};
