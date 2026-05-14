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

用 `agent-teams` 把多个 Agent 组织成团队：团队配置、任务列表、成员进程和信箱消息都存储在本地，默认目录为 `~/.agent-teams`。

安装包提供两个等价命令：`agent-teams` 和短命令 `teams`。常用短操作可用 `teams list`、`teams tasks <团队名>`；资源型命令示例优先写 `agent-teams --json teams list`，避免出现 `teams teams list` 的重复读感。

## 开始前

先确认命令存在并检查环境：

```bash
command -v teams || command -v agent-teams
teams --json doctor
```

`doctor` 会报告配置文件、存储目录、包根目录、支持平台和可用平台。本工具本身不需要网络认证；只需要对应 Agent 平台 CLI 已安装并登录或配置。

如需固定存储目录：

```bash
teams init --storage /path/to/.agent-teams
```

## 选择或创建团队

先发现已有团队，优先复用职能匹配的团队：

```bash
agent-teams --json teams list
agent-teams --json teams resolve review
agent-teams --json teams get <团队名>
```

没有合适团队时再创建。创建前可用 `--dry-run` 预览：

```bash
agent-teams --json teams create pr-review --desc "PR 安全、性能与测试覆盖审查" \
  --member 安全审查:claude:检查认证、授权与输入验证 \
  --member 性能审查:codex:检查查询与 API 性能 \
  --member 测试审查:gemini:检查测试覆盖 \
  --dry-run
```

确认后去掉 `--dry-run`。

## 添加和读取任务

任务应小而明确，描述中写清文件范围、验收标准和依赖：

```bash
agent-teams --json tasks add <团队名> "审查认证模块安全性" \
  --desc "范围：src/auth 与 src/middleware；关注认证、授权、输入校验"

agent-teams --json tasks list <团队名> --status pending --limit 20
agent-teams --json tasks claimable <团队名>
agent-teams --json tasks get <团队名> <task-id>
```

批量添加：

```bash
agent-teams --json tasks add-batch <团队名> --file tasks.json --dry-run
```

更新状态前优先预览：

```bash
agent-teams --json tasks set-status <团队名> <task-id> completed --dry-run
```

## 启动和沟通

启动团队成员：

```bash
teams members run <团队名> --cwd /path/to/project
```

查看成员与消息：

```bash
agent-teams --json members list <团队名>
agent-teams --json messages list <团队名> --limit 20
```

发送消息默认用 `--dry-run` 预览，确认后再去掉：

```bash
agent-teams --json messages send <团队名> --from lead --to <member-id> \
  --body "请优先处理 task_xxx，并只修改 src/auth。" --dry-run
```

## 安全边界

- 使用 `--json` 供 Codex 解析；人读输出只用于快速查看。
- 创建、删除、状态更新、发消息、安装 skill 前，优先使用 `--dry-run`。
- 不要执行 `teams delete`、`messages send`、`tasks set-status` 的真实写入，除非用户明确要求。
- `request get` 是只读 raw 逃生口，只在高层命令不够用时使用。
- 不要假设成员会自动按职责分配任务；任务需要成员主动认领，或由负责人通过 API/UI 指定。

## Raw 逃生口

```bash
agent-teams --json request get /storage
agent-teams --json request get /platforms
agent-teams --json request get /teams
agent-teams --json request get /teams/<团队名>
agent-teams --json request get /tasks/<团队名>
agent-teams --json request get /messages/<团队名>
```

## 常用示例

```bash
teams --json doctor
teams list
teams add-task review-team "审查 PR #142 安全风险" --desc "范围：src/auth, src/api"
```

```bash
teams create debug-team --desc "并行验证多个故障假设" \
  --member 数据库调查:codex:检查连接池与慢查询 \
  --member 缓存调查:claude:检查缓存失效与一致性
```

```bash
teams members run debug-team --cwd /path/to/project
```
