# agent-teams

协调多个 AI Agent（**Codex**、**Claude Code**、**Gemini**）作为团队协作，支持共享任务列表与代理间消息传递。概念参考 [Claude Code Agent Teams 文档](https://code.claude.com/docs/zh-CN/agent-teams)。

## 安装

```bash
npm install -g agent-teams
```

或作为项目依赖：

```bash
npm install agent-teams
```

## 前置条件

至少安装并配置好一个 Agent 平台的 CLI：

| 平台 | 安装 | 说明 |
|------|------|------|
| **Codex** | `npm install -g @openai/codex` | [OpenAI Codex CLI](https://developers.openai.com/codex/cli) |
| **Claude Code** | 见 [Claude Code 安装](https://code.claude.com/docs) | 需启用 Agent Teams 时可设 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| **Gemini** | `npm install -g @google/gemini-cli` | [Gemini CLI](https://google-gemini.github.io/gemini-cli/) |

检查可用平台：

```bash
agent-teams platforms
```

如果某个平台不可用，请参考 [平台配置指南](./docs/PLATFORM_CONFIG.md) 进行配置。

## 快速开始

### 1. 创建团队并添加成员

```bash
# 创建团队，指定成员名与平台（可混用多平台）
agent-teams create my-team --member 审查员:claude --member 架构师:codex --member 测试:gemini
```

### 2. 添加任务

```bash
# 单任务
agent-teams add-task my-team "审查 auth 模块安全性"

# 带描述与依赖
agent-teams add-task my-team "实现登录 API" --desc "REST API" --dep task_xxx
```

批量任务（JSON 文件 `tasks.json`）：

```json
[
  { "title": "任务1", "description": "可选描述" },
  { "title": "任务2", "dependencies": ["task_1_id"] }
]
```

```bash
agent-teams add-tasks my-team --file tasks.json
```

### 3. 查看任务

```bash
agent-teams tasks my-team
```

### 4. 查看团队成员

```bash
agent-teams members my-team
```

输出示例：
```
团队: my-team
成员数: 3

1. 审查员 (claude)
   ID: tm_xxx
   状态: 🟢 运行中
   职责: 负责代码审查，关注安全与性能

2. 架构师 (codex)
   ID: tm_yyy
   状态: ⚪ 已停止
   职责: 负责架构设计与技术选型

3. 测试 (gemini)
   ID: tm_zzz
   状态: ⚪ 已停止
```

### 5. 启动队友

**方式一：按已配置成员启动（推荐）**

先创建团队时已定义成员，直接运行团队即可为每个成员启动一个 Agent 进程：

```bash
agent-teams run my-team
```

工作目录默认为当前目录，可通过 `--cwd` 指定：

```bash
agent-teams run my-team --cwd /path/to/project
```

**方式二：临时生成新队友**

不修改团队配置，临时生成一个队友并传入初始提示：

```bash
agent-teams spawn my-team 安全审查员 claude "审查 src/auth/ 的安全与性能，并报告发现。"
```

按 `Ctrl+C` 可结束所有已启动的队友。

### 5. 清理团队

关闭所有队友后，删除团队数据与任务：

```bash
agent-teams cleanup my-team
```

## 存储与配置

- 默认根目录：`~/.agent-teams/`
  - `teams/<团队名>/config.json`：团队与成员配置
  - `teams/<团队名>/mailbox/`：代理间消息
  - `tasks/<团队名>/tasks.json`：任务列表

`config.json` 中每个成员可配置可选字段 `description`（职责描述），用于在 Web UI 中展示：

```json
{
  "name": "my-team",
  "members": [
    { "id": "tm_xxx", "name": "产品经理", "platform": "codex", "description": "负责需求与优先级，协调前后端排期。" },
    { "id": "tm_yyy", "name": "前端", "platform": "claude", "description": "负责 Web 前端与交互实现。" }
  ]
}
```

自定义存储根目录：

```bash
agent-teams --storage /path/to/storage create my-team --member 开发:claude
```

## 编程使用

```ts
import {
  createTeam,
  addTask,
  addTasks,
  listTasks,
  spawnTeammate,
  spawnExistingTeammate,
  getRunningTeammates,
  shutdownTeammate,
  getAvailablePlatforms,
} from 'agent-teams';

// 创建团队
createTeam({
  name: 'dev-team',
  members: [
    { name: '前端', platform: 'claude' },
    { name: '后端', platform: 'codex' },
  ],
});

// 添加任务（可带依赖）
addTask('dev-team', '实现用户模块', {
  description: 'CRUD + 校验',
  dependencies: [],
});
const tasks = addTasks('dev-team', [
  { title: '任务A' },
  { title: '任务B', dependencies: ['task_xxx'] },
]);

// 列出任务
const all = listTasks('dev-team');

// 启动队友（新增成员并启动）
const t = await spawnTeammate('dev-team', {
  name: '审查员',
  platform: 'claude',
  spawnPrompt: '审查 src/ 下的代码风格与潜在问题。',
});

// 或按已有成员启动
await spawnExistingTeammate('dev-team', memberId);

// 向队友发消息（若平台支持 stdin）
sendToTeammate(t.memberId, '请优先处理高优先级任务');

// 关闭队友
shutdownTeammate(t.memberId);

// 检查可用平台
const platforms = await getAvailablePlatforms(); // ['claude', 'codex', ...]
```

## 任务状态与认领

- **pending**：待处理  
- **in_progress**：进行中（已认领）  
- **completed**：已完成  

队友可通过编程 API 认领任务、完成任务（见 `teammateClaimTask`、`teammateCompleteTask`）；任务依赖未满足时不可认领。

## Skills 集成

`agent-teams` 项目包含通用 Skills，可在多个 Agent 平台使用（Codex、Claude Code、Gemini 等）。

### 查看可用 Skills

```bash
agent-teams list-skills
```

### 安装 Skill 到不同平台

**Codex：**
```bash
agent-teams install-skill codex
```

这会自动将技能复制到 Codex 的技能目录（`~/.codex/skills/agent-teams/`），然后重启 Codex 即可使用。

**其他平台：**
未来可能支持：
- `agent-teams install-skill claude` - 安装到 Claude Code
- `agent-teams install-skill gemini` - 安装到 Gemini CLI

### 查看技能安装路径

```bash
agent-teams skill-path codex
```

### 在 Agent CLI 中使用

**快捷指令（Codex）：**

- 在输入框输入 **`$`**，在列表中选择 **agent-teams**，再输入你的需求即可（正确用法是 `$` 唤起技能，不是 `/`）。
- 详见 [Codex 使用指南](docs/CODEX_USAGE.md#快捷指令使用--唤起技能)。

**自然语言：**

安装技能后，在对应的 Agent CLI（如 Codex）中可以直接说：

```
创建一个 agent team 来审查这个 PR，包含安全审查员、性能审查员和测试审查员
```

```
使用 agent-teams 协调多个 Agent 并行开发这个功能
```

Agent 会自动识别并使用 agent-teams 技能来：
1. 创建团队并添加成员
2. 添加任务
3. 启动队友进程
4. 监控任务进度

**详细使用指南**：请参阅 [Codex 使用指南](./docs/CODEX_USAGE.md)，包含：
- 完整安装步骤
- 实际使用示例
- 常见场景演示
- 故障排除指南

### Skills 结构

Skills 位于项目中的 `skills/agent-teams/` 目录：
- `SKILL.md` - 通用技能文档（所有平台共享）
- `agents/codex.yaml` - Codex 平台 UI 配置
- 未来可能添加 `agents/claude.yaml`、`agents/gemini.yaml` 等

这是一个**通用技能**，可以在多个 Agent 平台使用，而不是仅限 Codex。

## Web UI（可视化界面）

Agent Teams 提供了可视化的 Web 界面来管理团队和任务：

```bash
agent-teams ui
```

启动后会自动打开浏览器，访问 `http://localhost:3000`。

**功能特性**：
- 📊 团队列表和详情
- 📋 任务看板视图（待处理/进行中/已完成）
- 👥 团队成员管理（启动/停止队友）
- 🔄 实时状态更新（WebSocket）

详细使用说明请参阅 [Web UI 使用指南](./docs/UI_USAGE.md)。

## 文档

更多文档请参阅 [docs/](./docs/) 目录：

- [快速开始](./QUICK_START.md) - 5 分钟快速上手
- [Web UI 使用指南](./docs/UI_USAGE.md) - 可视化界面使用说明
- [开发指南](./docs/DEVELOPMENT.md) - 如何开发和运行项目
- [Codex 使用指南](./docs/CODEX_USAGE.md) - 在 Codex 中使用
- [架构文档](./docs/ARCHITECTURE.md) - 系统架构
- [测试指南](./docs/TESTING.md) - 测试说明
- [发布指南](./docs/PUBLISH.md) - npm 发布
- [文档索引](./docs/README.md) - 完整文档列表

## 参考

- [协调 Claude Code 会话团队](https://code.claude.com/docs/zh-CN/agent-teams)  
- [Claude Code 无头/编程运行](https://code.claude.com/docs/headless)  
- [Codex CLI](https://developers.openai.com/codex/cli)  
- [Gemini CLI](https://google-gemini.github.io/gemini-cli/)  

## License

MIT
