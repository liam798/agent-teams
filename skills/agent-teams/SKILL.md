---
name: agent-teams
description: 协调多个 AI Agent（Codex、Claude Code、Gemini）作为团队协作，支持共享任务列表与代理间消息传递。当用户需要并行化工作、多角度审查、跨层协调或使用竞争假设调试时使用。通过 agent-teams CLI 创建团队、添加任务、启动队友并协调工作。
metadata:
  short-description: 协调多平台 AI Agent 团队协作
  version: 0.1.0
  author: agent-teams
  tags:
    - multi-agent
    - collaboration
    - code-review
    - parallel-work
    - team-coordination
---

# Agent Teams

协调多个 AI Agent（Codex、Claude Code、Gemini）作为团队协作，支持共享任务列表与代理间消息传递。参考 [Claude Code Agent Teams 文档](https://code.claude.com/docs/zh-CN/agent-teams)。

## 何时使用

- **并行探索**：多个队友同时调查问题的不同方面
- **代码审查**：多个审查者分别关注安全性、性能、测试覆盖等
- **新功能开发**：队友各自负责独立模块，互不干扰
- **竞争假设调试**：队友并行测试不同理论，更快收敛到答案
- **跨层协调**：前端、后端、测试由不同队友负责

## 前置条件

确保已安装 `agent-teams`：
```bash
npm install -g agent-teams
```

至少安装并配置好一个 Agent 平台的 CLI：
- **Codex**: `npm install -g @openai/codex`
- **Claude Code**: 见 [Claude Code 安装](https://code.claude.com/docs)
- **Gemini**: `npm install -g @google/gemini-cli`

检查可用平台：`agent-teams platforms`

## 团队与选队

- **团队描述**：创建团队时用 `--desc "团队职能描述"` 写明该团队的用途（如「PR 安全与性能审查」「用户认证功能开发」）。描述会出现在 `agent-teams list` 和 API/UI 中。
- **Agent 选队**：使用前先执行 `agent-teams list` 查看现有团队及其描述；根据用户需求**选择职能匹配的团队**。若当前没有合适团队，应**建议用户创建新团队**并给出建议的团队名与 `--desc` 内容。

## 核心工作流程

### 1. 创建团队
```bash
agent-teams create <团队名> [--desc "团队职能描述"] --member <名称>:<平台>[:职责描述] [--member ...]
```
- **--desc**：可选，团队职能/用途描述，便于后续根据需求选队
- **名称:平台**：必填，如 `安全审查:claude`
- **职责描述**：可选，第三段用冒号分隔，用于在 UI 中展示成员职责、便于任务分配；描述中可含冒号，会整体保留

### 2. 添加任务
```bash
agent-teams add-task <团队名> "<任务标题>" [--desc "<描述>"] [--dep <任务ID>]
```

### 3. 启动队友
```bash
agent-teams run <团队名> [--cwd <工作目录>]
```

### 4. 查看状态
```bash
agent-teams list              # 列出所有团队（含描述，用于选队）
agent-teams tasks <团队名>    # 查看任务
```

## 在 Agent CLI 中使用

安装技能后，在 Agent CLI（Codex/Claude/Gemini）中可以直接用自然语言描述需求。

### 触发关键词

**选队 / 建队**：先 `agent-teams list` 看现有团队与描述；无合适团队时建议创建并带 `--desc` 写明职能。

**创建团队**：`创建一个 agent team`、`使用 agent-teams`、`协调多个 Agent`、`并行工作`、`多角度审查`

**管理任务**：`添加任务`、`查看任务`、`任务状态`

**启动队友**：`启动团队`、`运行队友`

### 智能场景识别

1. **代码审查**：用户提到"审查"、"review"、"PR" → 创建多个审查者（安全、性能、测试）
2. **并行开发**：用户提到"并行"、"前端"、"后端" → 创建不同角色的开发者
3. **调试问题**：用户提到"bug"、"调查"、"假设" → 创建多个调查者测试不同假设
4. **重构**：用户提到"重构"、"迁移"、"架构" → 创建分阶段执行团队

### 使用模板

**代码审查模板**：
```
1. agent-teams create <团队名> \
     --member 安全审查:claude:检查认证、授权与输入验证 \
     --member 性能审查:codex:检查查询与 API 性能 \
     --member 测试审查:gemini:检查测试覆盖率
2. agent-teams add-task <团队名> "审查 [目标]" --desc "[详细描述，包含相关文件路径]"
3. agent-teams run <团队名>
```

**并行开发模板**：
```
1. agent-teams create <团队名> \
     --member 前端:claude:实现 UI 与交互 \
     --member 后端:codex:实现 API 与数据层 \
     --member 测试:gemini:编写测试
2. TASK1=$(agent-teams add-task <团队名> "设计 API" --desc "..." | grep -o 'task_[a-z0-9]*')
3. agent-teams add-task <团队名> "实现前端" --desc "..." --dep $TASK1
4. agent-teams add-task <团队名> "实现后端" --desc "..." --dep $TASK1
5. agent-teams run <团队名>
```

**调试模板**：
```
1. agent-teams create <团队名> --member [假设1]:[平台] --member [假设2]:[平台]
2. agent-teams add-task <团队名> "[假设1的任务]" --desc "..."
3. agent-teams add-task <团队名> "[假设2的任务]" --desc "..."
4. agent-teams run <团队名>
```

## 完整示例

### 示例 1：审查 PR

**用户说**：
```
创建一个 agent team 来审查 PR #142：
- 安全审查员（claude）- 检查安全漏洞
- 性能审查员（codex）- 检查性能问题
- 测试审查员（gemini）- 检查测试覆盖
```

**Agent 执行**：
```bash
agent-teams create pr-review-team --desc "PR 安全、性能与测试覆盖审查" \
  --member 安全审查:claude:检查认证、授权与输入验证 \
  --member 性能审查:codex:检查数据库查询与 API 响应时间 \
  --member 测试审查:gemini:检查单元测试与集成测试覆盖

agent-teams add-task pr-review-team "审查 PR #142 的安全漏洞" \
  --desc "重点关注认证、授权、输入验证。相关文件：src/auth/, src/middleware/"

agent-teams add-task pr-review-team "审查 PR #142 的性能影响" \
  --desc "检查数据库查询、API 响应时间。相关文件：src/api/, src/models/"

agent-teams add-task pr-review-team "审查 PR #142 的测试覆盖" \
  --desc "检查单元测试和集成测试覆盖率。相关文件：tests/"

agent-teams run pr-review-team
```

### 示例 2：并行开发

**用户说**：
```
实现用户认证功能，创建一个 agent team：
- 前端开发者（claude）- 实现登录 UI
- 后端开发者（codex）- 实现认证 API
- 测试工程师（gemini）- 编写测试
```

**Agent 执行**：
```bash
agent-teams create auth-team \
  --member 前端:claude:实现登录 UI 与表单 \
  --member 后端:codex:实现 JWT 认证 API \
  --member 测试:gemini:编写端到端与集成测试

TASK1=$(agent-teams add-task auth-team "设计 API 规范" \
  --desc "定义登录、注册、登出 API 接口规范" | grep -o 'task_[a-z0-9]*')

agent-teams add-task auth-team "实现登录 UI" \
  --desc "实现登录表单组件，包含用户名、密码输入。相关文件：src/components/LoginForm.tsx" \
  --dep $TASK1

agent-teams add-task auth-team "实现认证 API" \
  --desc "实现 JWT token 生成和验证逻辑。相关文件：src/api/auth.ts" \
  --dep $TASK1

TASK2=$(agent-teams add-task auth-team "实现登录 UI" | grep -o 'task_[a-z0-9]*' || echo "")
TASK3=$(agent-teams add-task auth-team "实现认证 API" | grep -o 'task_[a-z0-9]*' || echo "")

agent-teams add-task auth-team "编写集成测试" \
  --desc "编写端到端测试，验证登录流程。相关文件：tests/e2e/auth.test.ts" \
  --dep $TASK2 --dep $TASK3

agent-teams run auth-team
```

## 关键原则

### 平台选择
- **Claude**：代码审查、架构设计、复杂逻辑分析
- **Codex**：代码生成、API 实现、性能优化
- **Gemini**：测试编写、文档生成、数据分析

### 团队与成员描述
- ✅ 创建团队时建议加上团队描述（`--desc "团队职能"`），便于 Agent 根据需求选择团队；若无合适团队则建议新建并写明 `--desc`
- ✅ 创建成员时建议加上职责描述（`--member 名称:平台:职责描述`），便于在 UI 中展示和后续按职责分配任务

### 任务设计
- ✅ 任务大小适中（1-4小时完成）
- ✅ 任务描述详细，包含相关文件路径
- ✅ 明确任务依赖关系，避免过长依赖链

### 避免冲突
- ✅ 每个队友负责不同的文件或目录
- ✅ 明确指定工作范围
- ✅ 使用任务依赖管理执行顺序

## 任务与成员职责

- **不会自动按职责分配**：系统不会根据 `config.json` 里成员的 `description`（职责描述）自动把任务分给某个成员。任务分配方式只有两种：
  1. **认领**：运行中的队友通过 `teammateClaimTask` 主动认领可认领任务（满足依赖、未被认领）。
  2. **负责人指定**：通过 `assignTask(teamName, taskId, assigneeId)` 或 API/UI 将任务指定给某成员。
- **职责描述的用途**：`description` 仅用于在 Web UI 中展示成员职责，便于人工或 Agent 判断「该把任务分给谁」。使用技能时，应由 **Agent/用户根据成员名称与职责描述，在添加任务后主动分配或指导认领**（例如先分配再 `run`，或在提示中说明由哪位成员负责哪类任务）。

## 最佳实践

1. **先选队再操作**：先执行 `agent-teams list` 根据团队描述选择匹配需求的团队；没有合适团队时建议用户创建新团队并给出 `--desc` 建议。
2. **团队描述要明确**：创建团队时用 `--desc "团队职能"` 写清用途，便于后续选队。
3. **任务描述要详细**：包含相关文件路径、技术细节、约束条件
4. **合理设置依赖**：只设置必要的依赖，避免过长依赖链
5. **定期检查进度**：使用 `agent-teams tasks <团队名>` 监控任务状态
6. **明确工作范围**：每个队友负责不同的文件或目录，避免冲突
7. **按职责分配任务**：创建团队时用 `--member 名称:平台:职责描述` 写好成员职责，添加任务后由 Agent 或用户根据职责调用 `assignTask` 或指导对应成员认领，避免任务无人认领或错配

## 错误处理

**常见问题**：
1. **命令未找到** → 检查 `agent-teams` 是否安装：`npm install -g agent-teams`
2. **平台不可用** → 检查平台：`agent-teams platforms`
3. **任务无法认领** → 检查依赖是否完成、任务是否已被认领
4. **队友进程异常** → 检查平台可用性、工作目录权限

## 编程使用

```javascript
import {
  createTeam,
  addTask,
  spawnExistingTeammate,
  listTasks,
  getRunningTeammates,
} from 'agent-teams';

// 创建团队（可选团队描述 description、成员职责描述）
createTeam({
  name: 'dev-team',
  description: '用户模块与 API 开发',  // 团队职能，便于选队
  members: [
    { name: '前端', platform: 'claude', description: '实现 UI 与交互' },
    { name: '后端', platform: 'codex', description: '实现 API 与数据层' },
  ],
});

// 添加任务
const task = await addTask('dev-team', '实现用户模块', {
  description: 'CRUD + 校验',
  dependencies: [],
});

// 启动队友
const config = loadTeamConfig('dev-team');
await spawnExistingTeammate('dev-team', config.members[0].id);

// 查看任务
const tasks = listTasks('dev-team');
```

## 存储位置

默认存储在 `~/.agent-teams/`：
- `teams/<团队名>/config.json` - 团队配置
- `teams/<团队名>/mailbox/` - 代理间消息
- `tasks/<团队名>/tasks.json` - 任务列表

自定义存储：`agent-teams --storage /path/to/storage create my-team`

## 更多信息

- [详细示例](./EXAMPLES.md) - 完整的使用示例和最佳实践
- [完整文档](../../README.md)
- [Codex 使用指南](../../docs/CODEX_USAGE.md)
- [架构文档](../../docs/ARCHITECTURE.md)
