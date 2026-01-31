# 📚 文档索引

小满日记 APK 构建和部署完整文档指南

## 🚀 快速开始

**新手推荐阅读顺序**：
1. [BUILD_SUCCESS.md](BUILD_SUCCESS.md) - 构建成功确认
2. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - 快速参考
3. [INSTALL_APK.md](INSTALL_APK.md) - 安装指南

## 📖 完整文档列表

### 核心文档

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [README.md](README.md) | 项目总览和快速开始 | 项目介绍、开发环境搭建 |
| [BUILD_SUCCESS.md](BUILD_SUCCESS.md) | 构建成功确认 | 首次构建后查看 |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | 快速参考卡片 | 日常开发快速查询 |

### 构建相关

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [BUILD_APK.md](BUILD_APK.md) | 完整 APK 构建指南 | 详细构建步骤和配置 |
| [BUILD_ANDROID.md](BUILD_ANDROID.md) | Android 原生构建说明 | 原生开发和调试 |
| [APK_BUILD_SUMMARY.md](APK_BUILD_SUMMARY.md) | 构建配置总结 | 了解构建配置详情 |

### 安装和部署

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [INSTALL_APK.md](INSTALL_APK.md) | APK 安装指南 | 安装方法和故障排除 |

### 安全和最佳实践

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [SECURITY_NOTES.md](SECURITY_NOTES.md) | 安全注意事项 | 密钥管理和安全配置 |

### 其他文档

| 文档 | 说明 | 适用场景 |
|------|------|----------|
| [REFACTORING.md](REFACTORING.md) | 重构记录 | 代码重构历史 |

## 🛠️ 脚本工具

### 构建脚本

| 脚本 | 说明 | 使用方法 |
|------|------|----------|
| `android/build-apk.sh` | APK 构建脚本 | `cd android && ./build-apk.sh` |
| `android/clean-and-build.sh` | 清理并构建 | `cd android && ./clean-and-build.sh` |

### 安装脚本

| 脚本 | 说明 | 使用方法 |
|------|------|----------|
| `install-test.sh` | 快速安装到设备 | `./install-test.sh` |

## 📋 常见任务快速导航

### 我想...

#### 第一次构建 APK
1. 阅读 [BUILD_APK.md](BUILD_APK.md)
2. 运行 `cd android && ./build-apk.sh`
3. 查看 [BUILD_SUCCESS.md](BUILD_SUCCESS.md)

#### 安装 APK 到设备
1. 阅读 [INSTALL_APK.md](INSTALL_APK.md)
2. 运行 `./install-test.sh`

#### 查找常用命令
- 查看 [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

#### 解决构建问题
1. 查看 [BUILD_APK.md](BUILD_APK.md) 的"常见问题"部分
2. 查看 [INSTALL_APK.md](INSTALL_APK.md) 的"故障排除"部分

#### 保护密钥安全
- 阅读 [SECURITY_NOTES.md](SECURITY_NOTES.md)

#### 更新版本号
1. 查看 [BUILD_SUCCESS.md](BUILD_SUCCESS.md) 的"版本管理"部分
2. 查看 [QUICK_REFERENCE.md](QUICK_REFERENCE.md) 的"版本更新流程"

#### 发布到应用商店
1. 阅读 [INSTALL_APK.md](INSTALL_APK.md) 的"分发建议"部分
2. 准备应用商店所需材料

## 🎯 按角色分类

### 开发者
**必读**：
- [README.md](README.md)
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- [BUILD_APK.md](BUILD_APK.md)

**推荐**：
- [BUILD_ANDROID.md](BUILD_ANDROID.md)
- [SECURITY_NOTES.md](SECURITY_NOTES.md)

### 测试人员
**必读**：
- [INSTALL_APK.md](INSTALL_APK.md)
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

### 运维/发布人员
**必读**：
- [BUILD_APK.md](BUILD_APK.md)
- [SECURITY_NOTES.md](SECURITY_NOTES.md)
- [APK_BUILD_SUMMARY.md](APK_BUILD_SUMMARY.md)

### 项目经理
**必读**：
- [README.md](README.md)
- [BUILD_SUCCESS.md](BUILD_SUCCESS.md)

## 📞 获取帮助

### 遇到问题？

1. **构建问题**
   - 查看 [BUILD_APK.md](BUILD_APK.md) → 常见问题
   - 运行 `cd android && ./gradlew assembleRelease --stacktrace`

2. **安装问题**
   - 查看 [INSTALL_APK.md](INSTALL_APK.md) → 故障排除
   - 运行 `adb devices` 检查设备连接

3. **安全问题**
   - 查看 [SECURITY_NOTES.md](SECURITY_NOTES.md)
   - 确保密钥文件安全

4. **其他问题**
   - 查看 [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
   - 搜索相关文档

## 🔄 文档更新

本文档索引最后更新：2026年1月31日

如需更新文档，请确保：
- 更新相关文档内容
- 更新本索引文件
- 更新 README.md 中的链接

## 📝 文档贡献

欢迎改进文档！提交 PR 时请：
- 保持文档结构清晰
- 使用简洁的语言
- 添加实用的示例
- 更新本索引文件

---

**提示**：建议将本文档加入书签，方便快速查找所需信息。
