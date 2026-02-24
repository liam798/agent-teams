# Agent-Teams Skill

这是 agent-teams 的通用技能，可以在多个 Agent 平台使用（Codex、Claude Code、Gemini 等）。

## 目录结构

```
agent-teams/
├── SKILL.md              # 通用技能文档（所有平台共享）
└── agents/               # 各平台的 UI 配置文件
    ├── codex.yaml       # Codex 平台配置
    └── ...              # 未来可能添加 claude.yaml, gemini.yaml 等
```

## 安装到不同平台

### Codex

```bash
agent-teams install-skill codex
```

技能会被安装到 `~/.codex/skills/agent-teams/`，并自动创建 `agents/openai.yaml`（Codex 期望的文件名）。

### 其他平台

未来可能支持：
- `agent-teams install-skill claude` - 安装到 Claude Code
- `agent-teams install-skill gemini` - 安装到 Gemini CLI

## 使用

安装后，在对应的 Agent CLI 中可以直接使用 agent-teams 功能。例如在 Codex 中说：

```
创建一个 agent team 来审查这个 PR
```

Agent 会自动识别并使用 agent-teams 技能。
