# 🤖 项目与 AI 的约定

> 本文档记录与 AI 协作时的持久化约定和规范，确保跨会话的一致性

**最后更新**: 2026-03-07

---

## 📋 文档管理约定

### 1. 任务记录规范

#### 任务文档存放位置
所有任务记录和工作流水文档统一存放在：
```
docs/tasks/
```

#### 文件命名规范
```
YYYYMMDD_TASK_NAME.md
```

**示例**：
- `20260307_CLEANUP_SUMMARY.md` - 2026年3月7日的文档清理任务
- `20260308_LOG_IMPLEMENTATION.md` - 2026年3月8日的日志实现任务
- `20260310_BUG_FIX_AUTH.md` - 2026年3月10日的认证bug修复

#### 任务文档模板
每个任务文档应包含：
```markdown
# 任务名称

## 任务时间
YYYY-MM-DD

## 任务目标
简要描述任务目标

## 执行步骤
1. 步骤1
2. 步骤2
...

## 完成情况
- ✅ 已完成项
- ⏳ 进行中
- ❌ 未完成

## 相关文件
列出修改的文件

## 注意事项
需要注意的问题或后续跟进事项
```

### 2. 文档分类规范

#### 根目录（核心文档）
- `README.md` - 项目说明
- `AI_CONVENTIONS.md` - AI 协作约定（本文档）
- `DOCS_INDEX.md` - 文档快速索引
- 构建部署相关核心文档

#### docs/ 目录结构
```
docs/
├── README.md              # 文档目录说明
├── tasks/                 # 任务记录（按日期命名）
├── jwt/                   # JWT 认证相关
├── logging/               # 日志打点相关
└── archive/               # 归档文档
```

### 3. 文档清理规则

#### 何时创建任务记录
- 完成一个功能模块
- 修复重要bug
- 进行代码重构
- 文档整理
- 系统迁移

#### 何时归档文档
- 任务完成超过3个月
- 文档内容已过期
- 被新文档替代
- 仅供历史查询

---

## 💻 代码规范约定

### 1. 日志打点规范

#### 使用 useLog Hook（推荐）
```typescript
import { useLog } from '@/hooks/useLog';

function MyComponent() {
  const { log } = useLog();
  
  // 曝光打点
  useEffect(() => {
    log('PAGE_EXPO');
  }, []);
  
  // 点击打点
  const handleClick = () => {
    log('BUTTON_CLICK');
  };
}
```

#### 直接使用 logByPosition
```typescript
import { logByPosition } from '@/services/logService';

// 需要手动传递 userId
if (userId) {
  logByPosition('ACTION_KEY' as any, userId);
}
```

#### 打点命名规范
- 使用大写字母和下划线
- 格式：`模块_操作_对象`
- 示例：`CHAT_TAB_EXPO`, `PLAN_CREATE_DONE`

### 2. 导入规范

#### 路径别名
使用 `@/` 作为 src 目录的别名：
```typescript
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/theme';
import { logByPosition } from '@/services/logService';
```

#### 导入顺序
1. React 相关
2. 第三方库
3. 项目内部模块（按 @/ 路径）
4. 相对路径导入
5. 样式文件

### 3. TypeScript 规范

#### Null 检查
```typescript
// 推荐
const data = await fetchData();
if (data) {
  // 使用 data
}

// 或使用可选链
const value = data?.property;
```

#### useRef 初始值
```typescript
// 正确
const ref = useRef<Type>(initialValue);

// 错误
const ref = useRef<Type>(); // 缺少初始值
```

---

## 🔄 工作流程约定

### 1. 新功能开发流程

1. **需求确认** - 明确功能需求和验收标准
2. **设计方案** - 确定技术方案和文件结构
3. **编码实现** - 按规范编写代码
4. **测试验证** - 运行测试，检查错误
5. **文档记录** - 创建任务记录文档
6. **代码提交** - 提交代码和文档

### 2. Bug 修复流程

1. **问题定位** - 分析错误日志，定位问题
2. **修复方案** - 确定修复方案
3. **代码修改** - 修复代码
4. **验证测试** - 确认问题已解决
5. **文档记录** - 记录修复过程
6. **代码提交** - 提交修复

### 3. 代码检查流程

#### 每次修改后必须检查
```bash
# TypeScript 类型检查
npx tsc --noEmit --skipLibCheck

# 查看诊断信息（在 Kiro 中）
getDiagnostics(['path/to/file.tsx'])
```

#### 提交前检查清单
- [ ] TypeScript 编译通过
- [ ] 没有 console.error
- [ ] 导入语句完整
- [ ] 代码格式正确
- [ ] 添加必要注释

---

## 📝 文档编写约定

### 1. Markdown 规范

#### 标题层级
- `#` - 文档标题（仅一个）
- `##` - 主要章节
- `###` - 子章节
- `####` - 详细说明

#### 代码块
使用语言标识：
````markdown
```typescript
// TypeScript 代码
```

```bash
# Shell 命令
```
````

#### 列表
- 使用 `-` 作为无序列表标记
- 使用 `1.` 作为有序列表标记
- 任务列表使用 `- [ ]` 和 `- [x]`

### 2. 文档内容规范

#### 必须包含
- 文档标题
- 创建/更新时间
- 目标/目的说明
- 详细内容
- 相关链接（如有）

#### 推荐包含
- 示例代码
- 注意事项
- 常见问题
- 后续计划

---

## 🎯 特殊约定

### 1. 会话开始时

#### AI 应该做的
1. 检查 `AI_CONVENTIONS.md` 了解约定
2. 查看 `docs/tasks/` 了解最近任务
3. 确认当前任务目标

#### 用户应该做的
- 明确说明任务目标
- 提供必要的上下文信息
- 指出特殊要求

### 2. 任务完成时

#### AI 应该做的
1. 创建任务记录文档（`docs/tasks/YYYYMMDD_TASK.md`）
2. 更新相关索引文档
3. 总结完成情况和注意事项

#### 用户应该做的
- 验证任务完成情况
- 确认文档记录准确
- 提出后续需求

### 3. 文档更新时

#### 何时更新本文档
- 新增持久化约定
- 修改工作流程
- 调整代码规范
- 添加特殊要求

#### 更新格式
在文档顶部更新"最后更新"日期，并在底部添加更新记录。

---

## 📚 参考文档

- [文档快速索引](DOCS_INDEX.md)
- [文档目录说明](docs/README.md)
- [JWT 快速参考](docs/jwt/JWT_QUICK_REFERENCE.md)
- [日志跟踪指南](docs/logging/LOG_TRACKING_GUIDE.md)

---

## 📋 更新记录

### 2026-03-07
- 创建本文档
- 定义任务记录规范
- 定义文档管理约定
- 定义代码规范约定
- 定义工作流程约定

---

## 💡 使用建议

### 对于 AI
1. **每次会话开始时**，先阅读本文档
2. **创建文档时**，遵循命名和格式规范
3. **完成任务时**，创建任务记录
4. **遇到新约定时**，更新本文档

### 对于开发者
1. **新成员入职时**，阅读本文档了解协作规范
2. **提出需求时**，参考工作流程约定
3. **发现问题时**，及时更新约定
4. **定期回顾**，确保约定仍然适用

---

**注意**: 本文档是动态的，应随项目发展持续更新。
