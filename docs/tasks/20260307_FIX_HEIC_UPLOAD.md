# 修复 HEIC 图片上传失败问题

## 任务时间
2026-03-07

## 问题描述
用户上传 `.heic` 格式的图片时，上传失败。

## 问题原因
1. HEIC (High Efficiency Image Container) 是 Apple 的专有图片格式
2. 代码将 HEIC 文件的 MIME 类型设置为 `image/heic`
3. 服务端可能不支持 `image/heic` MIME 类型
4. 部分浏览器和服务器不识别 HEIC 格式

## 解决方案

### 方案1：修改 MIME 类型映射（已实施）
**文件**: `services/imageService.ts`

将 HEIC/HEIF 格式的 MIME 类型映射为 `image/jpeg`：

```typescript
// 获取文件名和类型
const filename = imageUri.split('/').pop() || 'image.jpg';
const match = /\.(\w+)$/.exec(filename);
let type = match ? `image/${match[1]}` : 'image/jpeg';

// HEIC 格式处理：将 MIME 类型设置为 jpeg
// 因为服务端可能不支持 image/heic
if (type === 'image/heic' || type === 'image/heif') {
  type = 'image/jpeg';
}
```

**优点**：
- 实现简单，无需额外依赖
- 快速修复问题

**缺点**：
- 不是真正的格式转换，只是修改了 MIME 类型
- 如果服务端严格验证文件内容，可能仍然失败

### 方案2：使用 ImagePicker 的格式转换（推荐）
在选择图片时就转换为 JPEG 格式：

```typescript
import * as ImagePicker from 'expo-image-picker';

// 打开相册时指定格式
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1,
  // 关键配置：自动转换为 JPEG
  allowsMultipleSelection: false,
  // iOS 特定配置
  videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
});
```

或者使用 `expo-image-manipulator` 进行格式转换：

```bash
npx expo install expo-image-manipulator
```

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

const convertHeicToJpeg = async (uri: string): Promise<string> => {
  // 如果是 HEIC 格式，转换为 JPEG
  if (uri.toLowerCase().endsWith('.heic') || uri.toLowerCase().endsWith('.heif')) {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [], // 不做任何操作，只是转换格式
      { 
        compress: 0.9, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    return manipResult.uri;
  }
  return uri;
};

// 在上传前调用
const convertedUri = await convertHeicToJpeg(imageUri);
await uploadImage(convertedUri);
```

**优点**：
- 真正的格式转换
- 兼容性更好
- 可以控制压缩质量

**缺点**：
- 需要额外依赖
- 转换需要时间

### 方案3：服务端支持 HEIC（最佳方案）
在服务端添加 HEIC 格式支持：

**Node.js 示例**：
```bash
npm install heic-convert sharp
```

```javascript
const heicConvert = require('heic-convert');
const sharp = require('sharp');

// 检测并转换 HEIC
if (file.mimetype === 'image/heic' || file.originalname.endsWith('.heic')) {
  const inputBuffer = await fs.readFile(file.path);
  const outputBuffer = await heicConvert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 0.9
  });
  
  // 使用 sharp 进一步处理
  await sharp(outputBuffer)
    .jpeg({ quality: 90 })
    .toFile(outputPath);
}
```

**优点**：
- 客户端无需修改
- 统一处理所有格式
- 可以做更多优化（压缩、裁剪等）

**缺点**：
- 需要修改服务端代码
- 增加服务端处理负担

## 实施步骤

### 方案1实施（已废弃）
1. ✅ 修改 `uploadImage` 函数
2. ✅ 添加 HEIC/HEIF 格式检测
3. ✅ 将 MIME 类型映射为 `image/jpeg`
4. ❌ 服务端仍然无法处理 HEIC 文件内容

**结论**: 仅修改 MIME 类型不够，服务端图片处理库不支持 HEIC 格式。

### 方案2实施（最终方案）✅
客户端转换 HEIC 为 JPEG：

1. ✅ 安装依赖：
```bash
npx expo install expo-image-manipulator
```

2. ✅ 创建转换函数 `utils/imageConverter.ts`：
```typescript
import * as ImageManipulator from 'expo-image-manipulator';

export const convertHeicToJpeg = async (uri: string): Promise<string> => {
  const lowerUri = uri.toLowerCase();
  if (lowerUri.endsWith('.heic') || lowerUri.endsWith('.heif')) {
    console.log('[convertHeicToJpeg] 检测到 HEIC/HEIF 格式，开始转换为 JPEG...');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { 
        compress: 0.9, 
        format: ImageManipulator.SaveFormat.JPEG 
      }
    );
    console.log('[convertHeicToJpeg] 转换成功:', result.uri);
    return result.uri;
  }
  return uri;
};
```

3. ✅ 在 `hooks/useChat.ts` 的 `uploadImageAndUnderstand` 函数中集成：
```typescript
// 检查并转换 HEIC 格式
const { convertHeicToJpeg } = await import('@/utils/imageConverter');
const convertedUri = await convertHeicToJpeg(imageUri);
console.log('[uploadImageAndUnderstand] 转换后的 URI:', convertedUri);

// 上传图片（使用转换后的 URI）
const uploadResult = await imageService.uploadImage(convertedUri);
```

**优势**:
- 彻底解决服务端不支持 HEIC 的问题
- 转换后的 JPEG 格式兼容性好
- 不需要修改服务端代码
- 添加了详细的日志跟踪

## 测试建议

### 测试用例
1. 上传 JPEG 图片（应该正常）
2. 上传 PNG 图片（应该正常）
3. 上传 HEIC 图片（应该正常）
4. 上传 HEIF 图片（应该正常）

### 测试设备
- iOS 设备（iPhone 拍摄的照片默认是 HEIC）
- Android 设备（通常是 JPEG）

### 测试步骤
1. 打开对话页面
2. 点击图片按钮
3. 选择 HEIC 格式的图片
4. 验证上传成功
5. 验证图片正确显示

## 相关信息

### HEIC 格式说明
- **全称**: High Efficiency Image Container
- **开发者**: Apple
- **优点**: 文件更小，质量更好
- **缺点**: 兼容性差，需要转换

### 支持的图片格式
- JPEG/JPG - 最通用
- PNG - 支持透明
- GIF - 支持动画
- WebP - 现代格式
- HEIC/HEIF - Apple 格式（需要转换）

### MIME 类型映射
```typescript
const mimeTypes = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'heic': 'image/jpeg', // 映射为 jpeg
  'heif': 'image/jpeg', // 映射为 jpeg
};
```

## 注意事项

1. **iOS 默认格式**: iPhone 拍摄的照片默认是 HEIC 格式
2. **文件大小**: HEIC 文件通常比 JPEG 小 50%
3. **质量损失**: 转换为 JPEG 可能会有轻微质量损失
4. **兼容性**: 并非所有浏览器和服务器都支持 HEIC
5. **性能**: 格式转换需要时间，可能影响用户体验

## 错误处理

### 常见错误
1. **上传失败**: MIME 类型不支持
2. **文件损坏**: 转换失败
3. **超时**: 文件太大，转换时间过长

### 错误提示
```typescript
try {
  const convertedUri = await convertHeicToJpeg(imageUri);
  await uploadImage(convertedUri);
} catch (error) {
  if (error.message.includes('heic')) {
    Alert.alert('提示', '图片格式不支持，请选择其他图片');
  } else {
    Alert.alert('错误', '上传失败，请重试');
  }
}
```

## 相关文档
- [Expo ImagePicker 文档](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo ImageManipulator 文档](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [HEIC 格式说明](https://en.wikipedia.org/wiki/High_Efficiency_Image_File_Format)
- [AI 协作约定](../../AI_CONVENTIONS.md)
