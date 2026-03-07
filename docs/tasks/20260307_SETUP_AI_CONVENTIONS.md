# 设置 AI 协作约定和任务记录系统

## 任务时间
2026-03-07

## 任务目标
建立与 AI 协作的持久化约定系统，确保跨会话的一致性，并创建任务记录文件夹用于记录每次工作流水。

---

## 执行步骤

### 1. 创建任务记录文件夹
```bash
mkdir -p docs/tasks
```

**目的**: 专门存放任务记录和工作流水文档

### 2. 制定文件命名规范
**格式**: `YYYYMMDD_TASK_NAME.md`

**示例**:
- `20260307_CLEANUP_SUMMARY.md`
- `20260308_LOG_IMPLEMENTATION.md`
- `20260310_BUG_FIX_AUTH.md`

### 3. 创建 AI 协作约定文档
**文件**: `AI_CONVENTIONS.md`（根目录）

**内容包括**:
- 文档管理约定
- 代码规范约定
- 工作流程约定
- 特殊约定

### 4. 移动现有文档
将 `CLEANUP_SUMMARY.md` 移动到 `docs/tasks/` 并添加时间戳：
```bash
mv docs/CLEANUP_SUMMARY.md docs/tasks/20260307_CLEANUP_SUMMARY.md
```

### 5. 创建任务目录说明
**文件**: `docs/tasks/README.md`

**内容**:
- 文件命名规范
- 任务列表
- 任务文档模板
- 快速查找指南

### 6. 更新文档索引
更新以下文档以包含新的结构：
- `docs/README.md` - 添加 tasks 目录说明
- `DOCS_INDEX.md` - 添加任务记录和 AI 约定链接

---

## 完成情况

### ✅ 已完成
- [x] 创建 `docs/tasks/` 文件夹
- [x] 制定文件命名规范（YYYYMMDD_TASK_NAME.md）
- [x] 创建 `AI_CONVENTIONS.md` 约定文档
- [x] 移动并重命名 `CLEANUP_SUMMARY.md`
- [x] 创建 `docs/tasks/README.md`
- [x] 更新 `docs/README.md`
- [x] 更新 `DOCS_INDEX.md`
- [x] 创建本任务记录文档

---

## 新的文档结构

```
项目根目录/
├── AI_CONVENTIONS.md          # AI 协作约定（新增）
├── DOCS_INDEX.md              # 文档快速索引
├── README.md                  # 项目说明
├── BUILD_ANDROID.md           # Android 构建
├── SERVER_DEPLOYMENT_GUIDE.md # 服务器部署
├── SERVER_SETUP_CHECKLIST.md  # 服务器设置
├── TESTFLIGHT_TEST_CHECKLIST.md # TestFlight 测试
│
└── docs/
    ├── README.md              # 文档目录说明
    ├── tasks/                 # 任务记录（新增）
    │   ├── README.md
    │   ├── 20260307_CLEANUP_SUMMARY.md
    │   └── 20260307_SETUP_AI_CONVENTIONS.md
    ├── jwt/                   # JWT 认证相关
    ├── logging/               # 日志打点相关
    └── archive/               # 归档文档
```

---

## 相关文件

### 新增文件
1. `AI_CONVENTIONS.md` - AI 协作约定文档
2. `docs/tasks/README.md` - 任务目录说明
3. `docs/tasks/20260307_SETUP_AI_CONVENTIONS.md` - 本文档

### 移动文件
1. `docs/CLEANUP_SUMMARY.md` → `docs/tasks/20260307_CLEANUP_SUMMARY.md`

### 修改文件
1. `docs/README.md` - 添加 tasks 目录说明
2. `DOCS_INDEX.md` - 添加任务记录和 AI 约定链接

---

## 技术要点

### 1. 文件命名规范
- 使用 8 位日期前缀（YYYYMMDD）
- 任务名称使用大写字母和下划线
- 便于按时间排序和查找

### 2. 文档分类原则
- **核心文档** → 根目录
- **功能文档** → `docs/功能名/`
- **任务记录** → `docs/tasks/`（按日期）
- **临时文档** → `docs/archive/`

### 3. AI 约定文档的作用
- 跨会话持久化规范
- 统一代码风格
- 标准化工作流程
- 便于新成员了解协作方式

---

## 使用指南

### 对于 AI
1. **每次会话开始时**
   - 阅读 `AI_CONVENTIONS.md` 了解约定
   - 查看 `docs/tasks/` 了解最近任务

2. **完成任务时**
   - 创建任务记录：`docs/tasks/YYYYMMDD_TASK_NAME.md`
   - 更新 `docs/tasks/README.md` 的任务列表

3. **发现新约定时**
   - 更新 `AI_CONVENTIONS.md`
   - 记录更新日期和内容

### 对于开发者
1. **新成员入职**
   - 阅读 `AI_CONVENTIONS.md` 了解协作规范
   - 查看 `docs/tasks/` 了解项目历史

2. **提出需求**
   - 参考 `AI_CONVENTIONS.md` 中的工作流程
   - 明确任务目标和验收标准

3. **查找历史**
   - 按日期在 `docs/tasks/` 中查找
   - 使用文件名关键词搜索

---

## 注意事项

### 1. 文档维护
- 每完成一个任务，创建对应的任务记录
- 定期更新 `docs/tasks/README.md` 的任务列表
- 保持 `AI_CONVENTIONS.md` 的时效性

### 2. 命名一致性
- 严格遵循 `YYYYMMDD_TASK_NAME.md` 格式
- 任务名称要简洁明了
- 使用统一的任务类型前缀（FEATURE_, FIX_, REFACTOR_ 等）

### 3. 内容完整性
- 每个任务记录应包含完整信息
- 记录遇到的问题和解决方案
- 添加相关文件和参考资料链接

### 4. 跨会话一致性
- AI 应在每次会话开始时检查约定文档
- 用户应在需求变更时更新约定
- 保持文档和实际操作的一致性

---

## 后续计划

### 短期（1周内）
- [ ] 在实际使用中验证约定的有效性
- [ ] 根据反馈调整文档结构
- [ ] 完善任务文档模板

### 中期（1个月内）
- [ ] 积累足够的任务记录
- [ ] 总结常见模式和最佳实践
- [ ] 优化文档查找和索引

### 长期
- [ ] 建立自动化文档生成工具
- [ ] 集成到 CI/CD 流程
- [ ] 形成团队协作规范

---

## 参考资料

- [AI_CONVENTIONS.md](../../AI_CONVENTIONS.md) - AI 协作约定
- [docs/README.md](../README.md) - 文档目录说明
- [DOCS_INDEX.md](../../DOCS_INDEX.md) - 文档快速索引

---

## 总结

本次任务成功建立了与 AI 协作的持久化约定系统，包括：

1. ✅ 创建了专门的任务记录文件夹（`docs/tasks/`）
2. ✅ 制定了统一的文件命名规范（YYYYMMDD_TASK_NAME.md）
3. ✅ 编写了详细的 AI 协作约定文档（`AI_CONVENTIONS.md`）
4. ✅ 更新了文档索引和目录结构

这套系统将帮助：
- 保持跨会话的一致性
- 记录项目演进历史
- 便于新成员快速上手
- 提高协作效率

**下一步**: 在实际使用中验证和完善这套系统。
