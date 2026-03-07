# 项目文档目录

## 📁 目录结构

### `/` 根目录
核心文档，快速参考
- `README.md` - 项目说明
- `BUILD_ANDROID.md` - Android 构建指南
- `SERVER_DEPLOYMENT_GUIDE.md` - 服务器部署指南
- `SERVER_SETUP_CHECKLIST.md` - 服务器设置清单
- `TESTFLIGHT_TEST_CHECKLIST.md` - TestFlight 测试清单

### `/docs/jwt/` JWT 认证相关
JWT 认证系统的实现和迁移文档
- `JWT_QUICK_REFERENCE.md` - JWT 快速参考（常用）
- `JWT_IMPLEMENTATION_GUIDE.md` - JWT 实现指南
- `JWT_MIGRATION_GUIDE.md` - JWT 迁移指南
- `JWT_MIGRATION_COMPLETE.md` - JWT 迁移完成记录

### `/docs/logging/` 日志打点相关
用户行为日志打点系统文档
- `LOG_TRACKING_GUIDE.md` - 日志跟踪指南（常用）
- `LOG_IMPLEMENTATION_FINAL_SUMMARY.md` - 日志实现最终总结

### `/docs/tasks/` 任务记录
每次任务的执行过程和完成情况记录（按日期命名）
- `20260307_CLEANUP_SUMMARY.md` - 文档清理任务
- 更多任务记录...

### `/docs/archive/` 归档文档
已完成的修改记录和临时文档
- `DEBUG_JWT_CALLS.md` - JWT 调用调试记录
- `FIX_DUPLICATE_CALLS.md` - 修复重复调用记录
- `LOG_IMPLEMENTATION_STATUS.md` - 日志实现状态（已过期）
- `LOG_IMPORT_FIX_SUMMARY.md` - 日志导入修复总结
- `PENDING_LOGS_CHECKLIST.md` - 待实现日志清单（已完成）
- `REMAINING_LOG_KEYS.md` - 剩余日志键列表（已完成）
- `JS_ERRORS_FIX_SUMMARY.md` - JS 错误修复总结

## 📝 文档使用指南

### 新开发者入门
1. 阅读根目录 `README.md`
2. 查看 `BUILD_ANDROID.md` 了解构建流程
3. 参考 `docs/jwt/JWT_QUICK_REFERENCE.md` 了解认证系统
4. 参考 `docs/logging/LOG_TRACKING_GUIDE.md` 了解日志打点

### 部署和运维
1. `SERVER_DEPLOYMENT_GUIDE.md` - 服务器部署
2. `SERVER_SETUP_CHECKLIST.md` - 服务器配置
3. `TESTFLIGHT_TEST_CHECKLIST.md` - 测试发布

### 查找历史记录
查看 `docs/archive/` 目录中的归档文档

## 🔄 文档维护

### 添加新文档
- 核心文档放在根目录
- 功能模块文档放在对应子目录
- 临时/修改记录放在 `archive/`

### 归档规则
- 已完成的任务清单
- 已修复的问题记录
- 已过期的状态文档
- 临时调试文档

### 定期清理
建议每个版本发布后，将临时文档归档
