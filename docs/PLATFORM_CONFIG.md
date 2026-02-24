# 平台配置指南

本文档说明如何配置各个 Agent 平台，解决 `agent-teams run` 启动失败的问题。

## Codex 配置

### 问题：`Error loading configuration: config profile ... not found`

这个错误表示 Codex CLI 没有找到可用的 profile 配置。

### 解决方案

#### 1. 检查 Codex 是否已安装

```bash
codex --version
```

如果命令不存在，先安装 Codex：

```bash
npm install -g @openai/codex
```

#### 2. 检查认证文件是否存在

Codex 的 API key 存储在：
- macOS/Linux: `~/.codex/auth.json`
- Windows: `%USERPROFILE%\.codex\auth.json`

```bash
# macOS/Linux
ls -la ~/.codex/auth.json

# Windows (PowerShell)
Test-Path $env:USERPROFILE\.codex\auth.json
```

如果 `auth.json` 不存在或无效，需要登录。

**注意**：Codex 还有 `config.toml` 配置文件（用于其他设置），但 API key 存储在 `auth.json` 中。

#### 3. 登录 Codex

```bash
codex login
```

这会打开浏览器进行身份验证，完成后会创建默认配置。

**注意**：如果 `codex login` 失败或没有打开浏览器：
- 确保你在交互式终端中运行（不是在脚本或 CI/CD 中）
- 检查网络连接
- 尝试 `codex logout` 后再 `codex login`

#### 4. 验证配置

**方法 1：检查 auth.json（推荐）**

```bash
# macOS/Linux
cat ~/.codex/auth.json

# 应该看到类似内容：
# {
#   "OPENAI_API_KEY": "sk-proj-..."
# }
```

**方法 2：检查配置文件**

```bash
# macOS/Linux
cat ~/.codex/config.toml
```

`config.toml` 包含其他设置（如模型、personality 等），但 API key 存储在 `auth.json` 中。

**方法 3：尝试运行 codex status（仅在交互式终端）**

```bash
codex status
```

**注意**：`codex status` 需要交互式终端（TTY）。如果在非交互式环境（如脚本、CI/CD）中运行，会报错 `TERM is set to "dumb"`。这是正常的，不影响实际使用。

如果 `auth.json` 不存在或无效，需要重新登录。

#### 4. 如果 auth.json 存在但仍有 profile 错误

即使 `auth.json` 存在，如果 Codex 报错 "profile not found"，可能是：
1. `auth.json` 格式不正确或损坏
2. API key 已过期或无效
3. Codex CLI 版本更新导致配置格式变化

**解决方案**：

```bash
# 重新登录（这会更新 auth.json 和 config.toml）
codex logout
codex login
```

**如果重新登录后仍有问题**：

1. **检查 auth.json 内容**：
   ```bash
   cat ~/.codex/auth.json
   ```
   确保包含有效的 `OPENAI_API_KEY`。

2. **检查 Codex 版本**：
   ```bash
   codex --version
   ```

3. **尝试更新 Codex CLI**：
   ```bash
   npm install -g @openai/codex@latest
   ```

4. **检查是否有 shell alias 影响 Codex 命令**：
   ```bash
   type codex  # 或 which codex
   ```
   如果看到 alias，检查 alias 定义，确保没有传递无效的 `--profile` 参数。

#### 5. 如果使用自定义 profile

如果 Codex 配置中指定了特定 profile（如 `--profile my-profile`），确保该 profile 存在：

```bash
# 查看所有 profiles
codex status

# 或在 config.toml 中检查
cat ~/.codex/config.toml
```

如果 profile 不存在，可以：
- 移除 `--profile` 参数使用默认配置
- 或在 `config.toml` 中创建对应的 profile 配置

### 验证 Codex 可用性

```bash
agent-teams platforms
```

应该看到 `codex` 在可用平台列表中。

## Gemini 配置

### 问题：`GEMINI_API_KEY 未设置`

Gemini CLI 需要设置 API Key 环境变量。

### 解决方案

#### 1. 获取 Gemini API Key

访问 [Google AI Studio](https://makersuite.google.com/app/apikey) 或 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 创建 API Key。

#### 2. 设置环境变量

**macOS/Linux（临时）：**

```bash
export GEMINI_API_KEY="your-api-key-here"
```

**macOS/Linux（永久）：**

添加到 `~/.zshrc` 或 `~/.bashrc`：

```bash
echo 'export GEMINI_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**Windows（PowerShell，临时）：**

```powershell
$env:GEMINI_API_KEY="your-api-key-here"
```

**Windows（永久）：**

在系统环境变量中添加 `GEMINI_API_KEY`，或添加到 PowerShell profile：

```powershell
[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY', 'your-api-key-here', 'User')
```

#### 3. 验证环境变量

```bash
echo $GEMINI_API_KEY  # macOS/Linux
echo $env:GEMINI_API_KEY  # Windows PowerShell
```

#### 4. 验证 Gemini CLI 可用性

```bash
gemini --version
```

如果命令不存在，先安装：

```bash
npm install -g @google/gemini-cli
```

#### 5. 测试 Gemini API Key

```bash
gemini -p "Hello"
```

如果返回正常响应，说明配置成功。

### 验证 Gemini 可用性

```bash
agent-teams platforms
```

应该看到 `gemini` 在可用平台列表中。

## Claude Code 配置

### 前置条件

1. 安装 Claude Code CLI（见 [Claude Code 文档](https://code.claude.com/docs)）
2. 如果使用 Agent Teams 功能，设置环境变量：

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### 验证 Claude Code 可用性

```bash
agent-teams platforms
```

应该看到 `claude` 在可用平台列表中。

## 快速检查所有平台

运行以下命令检查所有平台的配置状态：

```bash
agent-teams platforms
```

输出示例：
```
已安装且可用的平台: codex, claude, gemini
支持的平台: codex, claude, gemini
```

如果某个平台不在"已安装且可用的平台"列表中，说明：
- 平台 CLI 未安装
- 或平台配置不正确（如 Codex 未登录、Gemini API Key 未设置）

## 常见问题

### Q: Codex 显示 "profile not found" 但配置文件存在

**A:** 配置文件存在但可能缺少必要的认证信息。检查步骤：

1. **检查 auth.json（API key 存储位置）**：
   ```bash
   cat ~/.codex/auth.json
   ```
   确保包含有效的 `OPENAI_API_KEY`。

2. **如果 auth.json 不存在或无效**：
   ```bash
   # 重新登录以更新 auth.json
   codex logout
   codex login
   ```

3. **检查 config.toml（其他配置）**：
   ```bash
   cat ~/.codex/config.toml
   ```

4. **检查是否有 shell alias 影响**：
   ```bash
   type codex  # 或 which codex
   ```
   如果看到 alias，确保 alias 中没有传递无效的 `--profile` 参数。

5. **如果重新登录后仍有问题**：
   - 检查 Codex CLI 版本：`codex --version`
   - 尝试更新：`npm install -g @openai/codex@latest`
   - 检查 Codex 文档是否有配置格式变化

### Q: Gemini API Key 设置了但 agent-teams 还是报错

**A:** 确保：
1. 环境变量在**当前 shell** 中已设置（运行 `echo $GEMINI_API_KEY` 验证）
2. 如果是在终端中设置的，确保在**同一个终端**中运行 `agent-teams run`
3. 或者将环境变量添加到 shell 配置文件（`~/.zshrc` 等）并重启终端

### Q: 如何为 agent-teams run 指定环境变量？

**A:** 可以在运行命令前设置：

```bash
export GEMINI_API_KEY="your-key"
agent-teams run my-team --cwd /path/to/project
```

或使用 `env` 命令：

```bash
env GEMINI_API_KEY="your-key" agent-teams run my-team --cwd /path/to/project
```

### Q: 多个平台都配置失败怎么办？

**A:** 逐个检查：

1. **Codex**: `codex status` → 如果失败，运行 `codex login`
2. **Gemini**: `echo $GEMINI_API_KEY` → 如果为空，设置环境变量
3. **Claude**: `claude --version` → 如果失败，安装 Claude Code CLI

然后运行 `agent-teams platforms` 验证。

## 配置检查清单

在运行 `agent-teams run` 前，确保：

- [ ] Codex: `codex status` 显示正常
- [ ] Gemini: `echo $GEMINI_API_KEY` 显示 API Key
- [ ] Claude: `claude --version` 显示版本号
- [ ] 运行 `agent-teams platforms` 确认所有需要的平台都在列表中

## 下一步

配置完成后，重新运行：

```bash
agent-teams run android-dev-team --cwd /Users/liam/temp
```

如果仍有问题，检查错误信息并参考上述解决方案。
