# Agent-Teams 快速开始

## 🚀 5 分钟快速上手

### 1. 安装（一次性）

```bash
# 安装 agent-teams
npm install -g agent-teams

# 安装技能到 Codex
agent-teams install-skill codex

# 重启 Codex
```

### 2. 在 Codex 中使用

直接在 Codex 中说：

```
创建一个 agent team 来审查这个 PR，包含安全审查员、性能审查员和测试审查员
```

Codex 会自动：
- ✅ 创建团队
- ✅ 添加任务
- ✅ 启动队友

## 📝 常用命令（在 Codex 中直接说）

### 创建团队
```
创建一个 agent team，包含：
- 前端开发者（claude）
- 后端开发者（codex）
- 测试工程师（gemini）
```

### 查看状态
```
查看所有团队：agent-teams list
查看任务：agent-teams tasks <团队名>
```

### 管理团队
```
停止所有队友
清理团队：agent-teams cleanup <团队名>
```

## 🎯 典型场景

### 代码审查
```
创建一个 agent team 来审查 PR #142：
- 安全审查员（claude）
- 性能审查员（codex）
- 测试审查员（gemini）
```

### 并行开发
```
使用 agent-teams 创建一个团队来并行开发这个功能：
- 前端（claude）负责 UI
- 后端（codex）负责 API
- 测试（gemini）负责测试
```

### 调试问题
```
创建一个 agent team 来并行调查这个 bug：
- 数据库专家（codex）
- 缓存专家（claude）
- 前端专家（gemini）
```

## 📚 详细文档

- [Codex 使用指南](./docs/CODEX_USAGE.md) - 完整使用说明
- [开发指南](./docs/DEVELOPMENT.md) - 如何开发和运行项目
- [README](./README.md) - 项目文档
- [架构文档](./docs/ARCHITECTURE.md) - 技术细节
- [文档索引](./docs/README.md) - 所有文档索引
