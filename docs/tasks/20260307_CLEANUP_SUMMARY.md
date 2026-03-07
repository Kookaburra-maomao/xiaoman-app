# 文档清理总结

## 清理时间
2026-03-07

## 清理目标
整理项目根目录的 MD 文档，将修改记录和功能文档分类归档，保持根目录简洁。

---

## 📁 新的文档结构

### 根目录（5个核心文档）
保留最常用的核心文档：
- `README.md` - 项目说明
- `BUILD_ANDROID.md` - Android 构建指南
- `SERVER_DEPLOYMENT_GUIDE.md` - 服务器部署指南
- `SERVER_SETUP_CHECKLIST.md` - 服务器设置清单
- `TESTFLIGHT_TEST_CHECKLIST.md` - TestFlight 测试清单

### docs/jwt/（4个文档）
JWT 认证系统相关文档：
- `JWT_QUICK_REFERENCE.md` - JWT 快速参考（常用）⭐
- `JWT_IMPLEMENTATION_GUIDE.md` - JWT 实现指南
- `JWT_MIGRATION_GUIDE.md` - JWT 迁移指南
- `JWT_MIGRATION_COMPLETE.md` - JWT 迁移完成记录

### docs/logging/（2个文档）
日志打点系统相关文档：
- `LOG_TRACKING_GUIDE.md` - 日志跟踪指南（常用）⭐
- `LOG_IMPLEMENTATION_FINAL_SUMMARY.md` - 日志实现最终总结

### docs/archive/（7个文档）
已完成的修改记录和临时文档：
- `DEBUG_JWT_CALLS.md` - JWT 调用调试记录
- `FIX_DUPLICATE_CALLS.md` - 修复重复调用记录
- `LOG_IMPLEMENTATION_STATUS.md` - 日志实现状态（已过期）
- `LOG_IMPORT_FIX_SUMMARY.md` - 日志导入修复总结
- `PENDING_LOGS_CHECKLIST.md` - 待实现日志清单（已完成）
- `REMAINING_LOG_KEYS.md` - 剩余日志键列表（已完成）
- `JS_ERRORS_FIX_SUMMARY.md` - JS 错误修复总结

---

## 📊 清理统计

### 清理前
- 根目录 MD 文件：18个
- 文档分散，难以查找
- 临时文档和核心文档混在一起

### 清理后
- 根目录 MD 文件：5个（核心文档）
- 功能文档分类：2个子目录（jwt, logging）
- 归档文档：1个子目录（archive）
- 总计：18个文档，结构清晰

---

## 🎯 清理原则

### 保留在根目录
1. **项目说明** - README.md
2. **构建部署** - 开发和运维必需
3. **快速参考** - 高频使用的文档

### 移动到子目录
1. **功能模块文档** - 按功能分类（jwt, logging）
2. **实现指南** - 详细的技术文档
3. **迁移记录** - 历史变更记录

### 归档处理
1. **已完成的任务清单** - 不再需要参考
2. **临时调试文档** - 问题已解决
3. **已过期的状态文档** - 被新文档替代
4. **修复记录** - 仅供历史查询

---

## 📖 使用指南

### 快速查找文档

#### 我想了解项目
→ 根目录 `README.md`

#### 我想构建 Android 应用
→ 根目录 `BUILD_ANDROID.md`

#### 我想了解 JWT 认证
→ `docs/jwt/JWT_QUICK_REFERENCE.md`

#### 我想添加日志打点
→ `docs/logging/LOG_TRACKING_GUIDE.md`

#### 我想部署服务器
→ 根目录 `SERVER_DEPLOYMENT_GUIDE.md`

#### 我想查看历史修改记录
→ `docs/archive/` 目录

### 文档索引
查看 `docs/README.md` 获取完整的文档目录和使用指南。

---

## 🔄 后续维护建议

### 添加新文档时
1. **核心文档** → 放在根目录
2. **功能文档** → 放在对应的 `docs/功能名/` 目录
3. **临时文档** → 完成后移到 `docs/archive/`

### 定期清理
建议每个版本发布后：
1. 检查是否有新的临时文档需要归档
2. 更新 `docs/README.md` 的文档索引
3. 删除不再需要的归档文档（可选）

### 文档命名规范
- 使用大写字母和下划线：`MY_DOCUMENT.md`
- 功能文档前缀：`JWT_`, `LOG_`, `API_` 等
- 指南类文档后缀：`_GUIDE.md`, `_REFERENCE.md`
- 记录类文档后缀：`_SUMMARY.md`, `_CHECKLIST.md`

---

## ✅ 清理完成

所有文档已按功能分类整理，根目录保持简洁，便于快速查找和维护。

**下一步建议**：
1. 更新 `.gitignore` 确保 docs 目录被正确跟踪
2. 在团队中分享新的文档结构
3. 更新 CI/CD 脚本中的文档路径引用（如有）
