# 在 Codex 中使用 Agent-Teams

本指南详细说明如何在 Codex CLI 中使用 agent-teams 技能。

## 📋 前置条件

### 1. 安装 agent-teams

```bash
npm install -g agent-teams
```

验证安装：

```bash
agent-teams --help
agent-teams platforms
```

### 2. 安装 Codex CLI

```bash
npm install -g @openai/codex
```

验证安装：

```bash
codex --version
```

### 3. 安装技能到 Codex

```bash
agent-teams install-skill codex
```

输出示例：
```
技能已安装到: /Users/yourname/.codex/skills/agent-teams
请重启 Codex 以加载新技能
```

### 4. 重启 Codex

关闭当前 Codex 会话，重新启动 Codex。

## 🚀 使用方式

### 快捷指令：使用 `$` 唤起技能

在 Codex 中唤起 agent-teams 技能应使用 **`$`**（技能提及），而不是斜杠命令。

1. **正确用法：`$`**
   - 在输入框输入 **`$`**，会列出已安装技能。
   - 选择 **agent-teams**，即可显式启用该技能，然后输入你的指令（如「列出所有团队」「创建审查团队」等），Codex 会按技能流程执行。

2. **说明**
   - 斜杠命令（`/`）用于 Codex 内置命令（如 `/status`、`/model`）；**技能的显式唤起方式为 `$` + 技能名**。
   - 输入 `$` 后选择 agent-teams，再输入需求即可。

### 方式一：自然语言触发（推荐）

在 Codex 中直接用自然语言描述你的需求，Codex 会自动识别并使用 agent-teams 技能。

#### 示例 1：代码审查

**你说：**
```
创建一个 agent team 来审查这个 PR，包含三个审查者：
- 安全审查员（使用 claude）
- 性能审查员（使用 codex）
- 测试覆盖审查员（使用 gemini）

然后添加任务：
1. 审查认证模块的安全性
2. 检查 API 响应时间
3. 验证单元测试覆盖率
```

**Codex 会自动执行：**
```bash
agent-teams create review-team --member 安全审查:claude --member 性能审查:codex --member 测试审查:gemini
agent-teams add-task review-team "审查认证模块的安全性"
agent-teams add-task review-team "检查 API 响应时间"
agent-teams add-task review-team "验证单元测试覆盖率"
agent-teams run review-team
```

#### 示例 2：并行开发

**你说：**
```
使用 agent-teams 创建一个团队来并行开发这个功能：
- 前端开发者（claude）负责 UI 组件
- 后端开发者（codex）负责 API
- 测试工程师（gemini）负责测试用例
```

**Codex 会自动执行：**
```bash
agent-teams create dev-team --member 前端:claude --member 后端:codex --member 测试:gemini
agent-teams add-task dev-team "实现 UI 组件"
agent-teams add-task dev-team "实现 API 端点"
agent-teams add-task dev-team "编写测试用例"
agent-teams run dev-team
```

#### 示例 3：调试多个假设

**你说：**
```
创建一个 agent team 来并行调查这个 bug，每个队友测试不同的假设：
- 假设1：数据库连接问题
- 假设2：缓存失效问题
- 假设3：并发竞争条件
```

**Codex 会自动执行：**
```bash
agent-teams create debug-team --member 数据库调查:claude --member 缓存调查:codex --member 并发调查:gemini
agent-teams add-task debug-team "调查数据库连接问题"
agent-teams add-task debug-team "调查缓存失效问题"
agent-teams add-task debug-team "调查并发竞争条件"
agent-teams run debug-team
```

### 方式二：直接调用 CLI 命令

你也可以在 Codex 中直接要求执行特定命令：

**你说：**
```
执行命令：agent-teams platforms
```

**你说：**
```
列出所有团队：agent-teams list
```

**你说：**
```
查看 review-team 的任务：agent-teams tasks review-team
```

## 📝 完整工作流示例

### 场景：审查一个大型 PR

**步骤 1：在 Codex 中描述需求**

```
我需要审查 PR #142。创建一个 agent team，包含：
1. 安全审查员（claude）- 检查安全漏洞
2. 性能审查员（codex）- 检查性能问题
3. 代码质量审查员（gemini）- 检查代码风格和最佳实践

为每个审查者添加相应的任务。
```

**步骤 2：Codex 自动创建团队和任务**

Codex 会执行类似以下命令：

```bash
# 创建团队
agent-teams create pr-review-team \
  --member 安全审查:claude \
  --member 性能审查:codex \
  --member 代码质量:gemini

# 添加任务
agent-teams add-task pr-review-team "审查 PR #142 的安全漏洞" --desc "重点关注认证、授权、输入验证"
agent-teams add-task pr-review-team "审查 PR #142 的性能影响" --desc "检查数据库查询、API 响应时间、资源使用"
agent-teams add-task pr-review-team "审查 PR #142 的代码质量" --desc "检查代码风格、最佳实践、可维护性"

# 启动队友
agent-teams run pr-review-team
```

**步骤 3：监控进度**

在 Codex 中询问：

```
查看 pr-review-team 的任务状态：agent-teams tasks pr-review-team
```

**步骤 4：查看结果**

队友完成后，Codex 可以读取任务结果和消息：

```
读取 pr-review-team 的所有消息
```

## 🎯 技能触发关键词

Codex 会根据以下关键词自动识别需要使用 agent-teams：

- "创建一个 agent team"
- "使用 agent-teams"
- "协调多个 Agent"
- "并行工作"
- "多角度审查"
- "团队协作"
- "并行开发"
- "并行调试"

## 💡 最佳实践

### 1. 明确描述需求

**好的描述：**
```
创建一个 agent team 来审查这个 PR，包含安全审查员、性能审查员和测试审查员。
安全审查员使用 claude，性能审查员使用 codex，测试审查员使用 gemini。
```

**不够明确的描述：**
```
用 agent teams 审查代码
```

### 2. 指定平台

明确指定每个队友使用的平台：

```
创建一个团队：
- 安全审查员（claude）
- 性能审查员（codex）
- 测试审查员（gemini）
```

### 3. 提供任务描述

为任务添加详细描述，帮助队友理解需求：

```
添加任务：审查认证模块
描述：重点关注 token 处理、session 管理、输入验证。应用使用 JWT tokens 存储在 httpOnly cookies 中。
```

### 4. 设置任务依赖

对于有依赖关系的任务，明确指定：

```
添加任务：实现登录 API（依赖：设计 API 规范）
```

## 🔍 故障排除

### 问题 0：平台配置问题（启动失败）

**症状**：`agent-teams run` 启动失败，报错：
- Codex: `Error loading configuration: config profile ... not found`
- Gemini: `GEMINI_API_KEY 未设置`

**解决方案**：

1. **Codex 配置问题**：
   ```bash
   # 检查 Codex 是否已登录
   codex status
   
   # 如果失败，重新登录
   codex logout
   codex login
   ```

2. **Gemini API Key 未设置**：
   ```bash
   # macOS/Linux: 设置环境变量
   export GEMINI_API_KEY="your-api-key-here"
   
   # 永久设置（添加到 ~/.zshrc 或 ~/.bashrc）
   echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **验证平台配置**：
   ```bash
   agent-teams platforms
   ```
   应该看到所有需要的平台都在"已安装且可用的平台"列表中。

详细配置指南请参考：[平台配置指南](./PLATFORM_CONFIG.md)

### 问题 1：Codex 没有识别技能

**症状**：Codex 没有自动使用 agent-teams

**解决方案**：
1. 确认技能已安装：
   ```bash
   ls ~/.codex/skills/agent-teams/
   ```

2. 确认技能文件存在：
   ```bash
   ls ~/.codex/skills/agent-teams/SKILL.md
   ls ~/.codex/skills/agent-teams/agents/openai.yaml
   ```

3. 重启 Codex

4. 使用更明确的关键词，如"使用 agent-teams 创建一个团队"

### 问题 2：agent-teams 命令未找到

**症状**：Codex 执行命令时提示 `agent-teams: command not found`

**解决方案**：
1. 确认 agent-teams 已全局安装：
   ```bash
   which agent-teams
   npm list -g agent-teams
   ```

2. 如果未安装，在 Codex 中执行：
   ```
   执行命令：npm install -g agent-teams
   ```

### 问题 3：平台不可用

**症状**：启动队友时提示"平台不可用"

**解决方案**：
1. 检查可用平台：
   ```bash
   agent-teams platforms
   ```

2. 安装缺失的平台：
   ```bash
   npm install -g @openai/codex      # Codex
   npm install -g @google/gemini-cli # Gemini
   # Claude Code 需要单独安装
   ```

### 问题 4：技能已安装但 Codex 不识别

**解决方案**：
1. 重新安装技能：
   ```bash
   agent-teams install-skill codex
   ```

2. 检查技能文件格式是否正确

3. 重启 Codex

## 📚 更多示例

### 示例：重构大型模块

**在 Codex 中说：**
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

### 示例：性能优化

**在 Codex 中说：**
```
应用响应慢，创建一个 agent team 来并行调查：
- 数据库专家（codex）- 检查数据库查询
- 缓存专家（claude）- 检查缓存策略
- 前端专家（gemini）- 检查前端性能

每个专家独立调查并报告发现。
```

## 🔗 相关资源

- [agent-teams README](../README.md) - 完整文档
- [测试指南](./TESTING.md) - 如何测试
- [架构文档](./ARCHITECTURE.md) - 架构说明
- [文档索引](./README.md) - 所有文档索引
- [Codex Skills 文档](https://code.claude.com/docs/zh-CN/skills) - Codex 技能系统

## ❓ 常见问题

**Q: Codex 会自动使用 agent-teams 吗？**

A: 是的，当你使用相关关键词（如"创建一个 agent team"）时，Codex 会自动识别并使用 agent-teams 技能。

**Q: 可以在 Codex 中直接执行 agent-teams 命令吗？**

A: 可以，你可以直接说"执行命令：agent-teams list"等。

**Q: 如何查看团队状态？**

A: 在 Codex 中说"查看团队状态：agent-teams tasks <团队名>"。

**Q: 队友进程在哪里运行？**

A: 队友进程在后台运行，你可以通过 `agent-teams tasks` 查看任务状态，或直接与队友交互。

**Q: 如何停止队友？**

A: 在 Codex 中说"停止所有队友"或直接按 Ctrl+C（如果是在终端中运行 `agent-teams run`）。
