/**
 * 图片格式转换工具
 * SDK 55 中 expo-image-manipulator 在 Expo Go 中可能不可用，
 * 做降级处理：转换失败时返回原始 URI
 */

/**
 * 将 HEIC/HEIF 格式转换为 JPEG
 * @param uri 图片 URI
 * @returns 转换后的图片 URI（如果不是 HEIC/HEIF 或转换失败则返回原 URI）
 */
export const convertHeicToJpeg = async (uri: string): Promise<string> => {
  const lowerUri = uri.toLowerCase();
  
  // 只有 HEIC/HEIF 格式才需要转换
  if (!lowerUri.endsWith('.heic') && !lowerUri.endsWith('.heif')) {
    return uri;
  }

  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { 
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return result.uri;
  } catch (error: any) {
    console.warn('[convertHeicToJpeg] 转换失败，使用原始URI:', error.message);
    // 降级：返回原始 URI，大多数情况下服务端也能处理
    return uri;
  }
};
