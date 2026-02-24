# Agent-Teams 架构说明

## 项目结构

```
agent-teams/
├── src/                    # 源代码
│   ├── cli.ts              # CLI 入口
│   ├── index.ts            # 编程 API 导出
│   ├── types.ts            # 类型定义
│   ├── team/               # 团队管理
│   ├── tasks/              # 任务管理
│   ├── mailbox/            # 消息系统
│   ├── platforms/          # Agent 平台适配器
│   └── utils/              # 工具函数（存储、技能管理）
├── skills/                 # Skills 目录（供 Agent CLI 使用）
│   └── agent-teams/        # 通用技能（适用于多个平台）
│       ├── SKILL.md        # 通用技能文档（所有平台共享）
│       ├── README.md       # 技能说明
│       └── agents/         # 各平台的 UI 配置
│           └── codex.yaml  # Codex 平台配置
│                           # 未来可能添加 claude.yaml, gemini.yaml 等
├── dist/                   # 编译输出
└── package.json
```

## 核心功能

### 1. CLI 工具 (`agent-teams`)

提供命令行接口来管理团队、任务和技能：

- **团队管理**：`create`, `list`, `cleanup`
- **任务管理**：`add-task`, `add-tasks`, `tasks`
- **队友管理**：`spawn`, `run`
- **平台检查**：`platforms`
- **技能管理**：`install-skill`, `list-skills`, `skill-path`

### 2. 编程 API (`import from 'agent-teams'`)

提供 TypeScript/JavaScript API 供程序调用：

```typescript
import {
  createTeam,
  addTask,
  spawnTeammate,
  getRunningTeammates,
} from 'agent-teams';
```

### 3. Skills 集成

项目包含 Skills，供不同的 Agent CLI（Codex、Gemini 等）使用：

- **Codex Skill**：位于 `skills/codex/`
- 通过 `agent-teams install-skill codex` 安装到 Codex
- Codex 会自动识别何时使用 agent-teams

## 工作流程

### 方式一：直接使用 CLI

```bash
# 1. 创建团队
agent-teams create my-team --member 审查员:claude --member 架构师:codex

# 2. 添加任务
agent-teams add-task my-team "审查 auth 模块"

# 3. 启动队友
agent-teams run my-team
```

### 方式二：在 Codex 中使用（通过 Skill）

1. 安装技能：
   ```bash
   agent-teams install-skill codex
   ```

2. 重启 Codex

3. 在 Codex 中直接说：
   ```
   创建一个 agent team 来审查这个 PR
   ```

   Codex 会自动调用 `agent-teams` CLI 来执行操作。

### 方式三：编程集成

```typescript
import { createTeam, addTask, spawnTeammate } from 'agent-teams';

// 在 Node.js 脚本中使用
createTeam({ name: 'dev-team', members: [...] });
await addTask('dev-team', '实现功能');
await spawnTeammate('dev-team', { ... });
```

## Skills 系统

### Skills 位置

Skills 位于项目的 `skills/agent-teams/` 目录，这是一个**通用技能**，可以在多个 Agent 平台使用。

### 支持的平台

- ✅ **Codex**：`agents/codex.yaml` - 完整支持，安装时自动创建 `openai.yaml`
- 🔜 **Claude Code**：未来可能添加 `agents/claude.yaml`
- 🔜 **Gemini**：未来可能添加 `agents/gemini.yaml`

### Skill 结构

```
skills/agent-teams/
├── SKILL.md              # 通用技能文档（所有平台共享）
├── README.md            # 技能说明
└── agents/              # 各平台的 UI 配置
    └── codex.yaml       # Codex 平台配置
```

这是一个**通用技能**，而不是平台特定的技能。`SKILL.md` 包含所有平台共享的文档，而 `agents/` 目录包含各平台特定的 UI 配置。

### 安装技能

```bash
# 安装到 Codex
agent-teams install-skill codex

# 查看安装路径
agent-teams skill-path codex

# 列出所有可用技能
agent-teams list-skills
```

### Skill 结构

每个 Skill 包含：

- `SKILL.md` - 技能文档（YAML frontmatter + Markdown 说明）
- `agents/openai.yaml` - UI 元数据（显示名称、描述等）

## 存储结构

默认存储在 `~/.agent-teams/`：

```
~/.agent-teams/
├── teams/
│   └── <团队名>/
│       ├── config.json      # 团队配置
│       └── mailbox/         # 消息文件
└── tasks/
    └── <团队名>/
        ├── tasks.json       # 任务列表
        └── .lock            # 文件锁
```

## 平台适配

支持三种 Agent 平台：

1. **Codex** (`@openai/codex`) - 通过 `codex -p "prompt"` 调用
2. **Claude Code** (`claude`) - 通过 `claude -p "prompt"` 调用
3. **Gemini** (`@google/gemini-cli`) - 通过 `gemini -p "prompt"` 调用

每个平台实现 `IAgentPlatform` 接口：
- `checkAvailable()` - 检查平台是否可用
- `spawn()` - 生成 Agent 进程
- `sendMessage()` - 发送消息（可选）

## 设计原则

1. **Skills 在项目中**：Skills 作为项目的一部分，随包一起发布
2. **CLI 管理 Skills**：通过 `agent-teams install-skill` 安装到各平台
3. **多平台支持**：同一套代码支持 Codex、Claude Code、Gemini
4. **编程 + CLI**：既提供 CLI 工具，也提供编程 API
