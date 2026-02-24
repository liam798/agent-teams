# Agent-Teams 详细示例

本文档包含 agent-teams 的详细使用示例和最佳实践。

## 目录

- [代码审查示例](#代码审查示例)
- [并行开发示例](#并行开发示例)
- [调试问题示例](#调试问题示例)
- [重构示例](#重构示例)
- [编程 API 示例](#编程-api-示例)
- [最佳实践](#最佳实践)

## 代码审查示例

### 场景：审查 PR

**在 Codex 中说**：
```
创建一个 agent team 来审查 PR #142：
- 安全审查员（claude）- 检查安全漏洞，重点关注认证、授权、输入验证
- 性能审查员（codex）- 检查性能问题，重点关注数据库查询、API 响应时间
- 测试审查员（gemini）- 检查测试覆盖，重点关注单元测试和集成测试

为每个审查者添加相应的任务，然后启动团队。
```

**完整执行流程**：
```bash
# 1. 创建团队
agent-teams create pr-review-team \
  --member 安全审查:claude \
  --member 性能审查:codex \
  --member 测试审查:gemini

# 2. 添加任务
agent-teams add-task pr-review-team "审查 PR #142 的安全漏洞" \
  --desc "重点关注认证、授权、输入验证。检查 JWT token 处理、session 管理、SQL 注入防护。相关文件：src/auth/, src/middleware/"

agent-teams add-task pr-review-team "审查 PR #142 的性能影响" \
  --desc "检查数据库查询效率、API 响应时间、资源使用情况。重点关注 N+1 查询问题、缓存使用、索引优化。相关文件：src/api/, src/models/"

agent-teams add-task pr-review-team "审查 PR #142 的测试覆盖" \
  --desc "检查单元测试和集成测试覆盖率。确保新代码有充分的测试覆盖，包括边界情况和错误处理。相关文件：tests/unit/, tests/integration/"

# 3. 启动团队
agent-teams run pr-review-team

# 4. 监控进度（可选）
agent-teams tasks pr-review-team
```

## 并行开发示例

### 场景：实现用户认证功能

**在 Codex 中说**：
```
我需要实现用户认证功能。创建一个 agent team：
- 前端开发者（claude）- 实现登录 UI 组件
- 后端开发者（codex）- 实现认证 API
- 测试工程师（gemini）- 编写测试用例

任务：
1. 设计 API 规范（后端）
2. 实现登录 UI（前端，依赖任务1）
3. 实现认证 API（后端，依赖任务1）
4. 编写集成测试（测试，依赖任务2和3）
```

**完整执行流程**：
```bash
# 创建团队
agent-teams create auth-dev-team \
  --member 前端:claude \
  --member 后端:codex \
  --member 测试:gemini

# 添加任务（注意依赖关系）
TASK1=$(agent-teams add-task auth-dev-team "设计 API 规范" \
  --desc "定义登录、注册、登出 API 接口规范。包括请求/响应格式、错误码、认证方式（JWT）" \
  | grep -o 'task_[a-z0-9]*' || echo "task_design_api")

agent-teams add-task auth-dev-team "实现登录 UI" \
  --desc "实现登录表单组件（src/components/LoginForm.tsx），包含用户名、密码输入、错误提示、加载状态。使用 React Hook Form 进行表单验证" \
  --dep $TASK1

agent-teams add-task auth-dev-team "实现认证 API" \
  --desc "实现 JWT token 生成和验证逻辑（src/api/auth.ts）。包括登录、注册、token 刷新、密码加密（bcrypt）" \
  --dep $TASK1

# 注意：实际执行时需要捕获任务ID
TASK2=$(agent-teams add-task auth-dev-team "实现登录 UI" | grep -o 'task_[a-z0-9]*' || echo "")
TASK3=$(agent-teams add-task auth-dev-team "实现认证 API" | grep -o 'task_[a-z0-9]*' || echo "")

agent-teams add-task auth-dev-team "编写集成测试" \
  --desc "编写端到端测试（tests/e2e/auth.test.ts），验证登录流程。包括成功登录、错误处理、token 刷新" \
  --dep $TASK2 --dep $TASK3

# 启动团队
agent-teams run auth-dev-team
```

## 调试问题示例

### 场景：调查性能问题

**在 Codex 中说**：
```
应用响应慢，创建一个 agent team 来并行调查：
- 数据库专家（codex）- 检查数据库查询和索引
- 缓存专家（claude）- 检查缓存策略和命中率
- 前端专家（gemini）- 检查前端渲染和资源加载

每个专家独立调查并报告发现。
```

**完整执行流程**：
```bash
agent-teams create perf-debug-team \
  --member 数据库专家:codex \
  --member 缓存专家:claude \
  --member 前端专家:gemini

agent-teams add-task perf-debug-team "调查数据库性能" \
  --desc "检查慢查询日志、缺失索引、N+1 查询问题。重点关注用户相关的查询（users 表、orders 表）。使用 EXPLAIN 分析查询计划，检查索引使用情况。相关文件：src/models/, src/repositories/"

agent-teams add-task perf-debug-team "调查缓存性能" \
  --desc "检查 Redis 缓存命中率、缓存策略、缓存失效问题。分析缓存 key 设计、TTL 设置、缓存预热策略。相关文件：src/services/cache.ts, src/middleware/cache.ts"

agent-teams add-task perf-debug-team "调查前端性能" \
  --desc "检查 JavaScript bundle 大小、资源加载时间、渲染性能。使用 Lighthouse 分析，检查代码分割、懒加载、图片优化。相关文件：src/components/, webpack.config.js"

agent-teams run perf-debug-team
```

## 重构示例

### 场景：重构认证模块

**在 Codex 中说**：
```
我需要重构 authentication 模块。创建一个 agent team：
- 架构师（codex）- 设计新架构
- 迁移工程师（claude）- 执行迁移
- 测试工程师（gemini）- 编写测试

任务：
1. 设计新架构（架构师）
2. 迁移现有代码（迁移工程师，依赖：任务1）
3. 编写集成测试（测试工程师，依赖：任务2）
```

**完整执行流程**：
```bash
agent-teams create refactor-team \
  --member 架构师:codex \
  --member 迁移工程师:claude \
  --member 测试工程师:gemini

TASK1=$(agent-teams add-task refactor-team "设计新架构" \
  --desc "设计新的认证架构。包括：JWT vs Session、OAuth2 集成、多因素认证支持、密码策略。输出架构文档和迁移计划" \
  | grep -o 'task_[a-z0-9]*' || echo "task_design")

agent-teams add-task refactor-team "迁移现有代码" \
  --desc "根据新架构迁移现有代码。保持向后兼容，逐步迁移。相关文件：src/auth/, src/middleware/auth.ts" \
  --dep $TASK1

TASK2=$(agent-teams add-task refactor-team "迁移现有代码" | grep -o 'task_[a-z0-9]*' || echo "task_migrate")

agent-teams add-task refactor-team "编写集成测试" \
  --desc "为新架构编写集成测试。包括：登录流程、token 验证、权限检查、错误处理。相关文件：tests/integration/auth.test.ts" \
  --dep $TASK2

agent-teams run refactor-team
```

## 编程 API 示例

### 基础使用

```javascript
import {
  createTeam,
  addTask,
  addTasks,
  listTasks,
  spawnExistingTeammate,
  getRunningTeammates,
  loadTeamConfig,
} from 'agent-teams';

// 创建团队
createTeam({
  name: 'dev-team',
  members: [
    { name: '前端', platform: 'claude' },
    { name: '后端', platform: 'codex' },
    { name: '测试', platform: 'gemini' },
  ],
});

// 添加任务
const task1 = await addTask('dev-team', '实现用户模块', {
  description: 'CRUD + 校验',
  dependencies: [],
});

// 批量添加任务
const tasks = await addTasks('dev-team', [
  { title: '任务A', description: '描述A' },
  { title: '任务B', description: '描述B', dependencies: [task1.id] },
]);

// 启动队友
const config = loadTeamConfig('dev-team');
await spawnExistingTeammate('dev-team', config.members[0].id);

// 查看任务
const allTasks = listTasks('dev-team');
console.log(`总任务数: ${allTasks.length}`);
```

### 自动化代码审查

```javascript
async function reviewPR(prNumber, files) {
  const teamName = `pr-${prNumber}-review`;
  
  // 创建审查团队
  createTeam({
    name: teamName,
    members: [
      { name: '安全审查', platform: 'claude' },
      { name: '性能审查', platform: 'codex' },
      { name: '测试审查', platform: 'gemini' },
    ],
  });
  
  // 添加审查任务
  await addTask(teamName, '安全审查', {
    description: `审查 PR #${prNumber} 的安全问题，重点关注：${files.join(', ')}`,
  });
  
  await addTask(teamName, '性能审查', {
    description: `审查 PR #${prNumber} 的性能影响`,
  });
  
  await addTask(teamName, '测试审查', {
    description: `审查 PR #${prNumber} 的测试覆盖`,
  });

  // 启动所有审查者
  const config = loadTeamConfig(teamName);
  for (const member of config.members) {
    await spawnExistingTeammate(teamName, member.id);
  }

  return teamName;
}
```

### 任务依赖管理

```javascript
async function setupDevelopmentPipeline(teamName) {
  // 创建任务链
  const designTask = await addTask(teamName, '设计 API 规范', {
    description: '设计 REST API 接口规范',
  });

  const frontendTask = await addTask(teamName, '实现前端', {
    description: '实现前端 UI 组件',
    dependencies: [designTask.id],
  });

  const backendTask = await addTask(teamName, '实现后端', {
    description: '实现后端 API',
    dependencies: [designTask.id],
  });

  const testTask = await addTask(teamName, '编写测试', {
    description: '编写集成测试',
    dependencies: [frontendTask.id, backendTask.id],
  });

  return { designTask, frontendTask, backendTask, testTask };
}
```

### 监控任务进度

```javascript
import { listTasks } from 'agent-teams';

function getTaskStats(teamName) {
  const tasks = listTasks(teamName);
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };
}

// 定期检查进度
setInterval(() => {
  const stats = getTaskStats('dev-team');
  console.log(`进度: ${stats.completed}/${stats.total} 已完成`);
  if (stats.completed === stats.total) {
    console.log('所有任务已完成！');
  }
}, 5000);
```

## 最佳实践

### 1. 任务设计

**好的任务**：
- ✅ 独立、可测试、有明确完成标准
- ✅ 大小适中（1-4小时完成）
- ✅ 描述详细，包含相关文件路径

**不好的任务**：
- ❌ 太大（需要多天完成）
- ❌ 太小（几分钟完成）
- ❌ 描述模糊，缺少上下文

### 2. 避免文件冲突

**好的分配**：
```bash
agent-teams spawn my-team 前端 claude "负责 src/frontend/ 目录"
agent-teams spawn my-team 后端 codex "负责 src/backend/ 目录"
```

**不好的分配**：
```bash
agent-teams spawn my-team 开发者1 claude "开发功能"  # 没有明确范围
agent-teams spawn my-team 开发者2 codex "开发功能"  # 可能冲突
```

### 3. 平台选择

**根据任务特点选择平台**：
- **Claude**：代码审查、架构设计、复杂逻辑
- **Codex**：代码生成、API 实现、性能优化
- **Gemini**：测试编写、文档生成、数据分析

### 4. 任务依赖管理

**设置依赖的原则**：
- 只设置必要的依赖
- 避免过长的依赖链
- 使用描述明确依赖关系

### 5. 消息传递

**何时使用消息**：
- 需要协调多个队友
- 需要传递重要信息
- 需要引导队友方向

```javascript
import { sendMessage } from 'agent-teams';

sendMessage('my-team', {
  from: 'coordinator',
  to: 'teammate-id',
  content: '请优先处理高优先级任务。当前优先级：1. 安全修复 2. 性能优化',
});
```

## 参考

- [SKILL.md](./SKILL.md) - 技能主文档
- [完整文档](../../README.md)
- [Codex 使用指南](../../docs/CODEX_USAGE.md)
