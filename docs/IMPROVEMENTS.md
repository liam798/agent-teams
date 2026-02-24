# 改进计划

基于设计审查，以下是建议的改进项，按优先级排序。

## ✅ 已修复

1. **ESM `__dirname` 问题** - 已修复，使用 `import.meta.url` 和 `fileURLToPath`

## 🔴 高优先级（建议立即修复）

### 1. API 一致性改进

**问题**：`createTeam` 和 `listTasks` 是同步的，但 `addTask` 是异步的

**方案A（推荐）**：保持现状，但明确文档
- 在 README 中明确说明哪些函数是同步的，哪些是异步的
- 在函数注释中说明

**方案B**：全部改为异步
- 优点：一致性更好
- 缺点：需要修改现有代码，可能影响性能（文件 I/O 操作）

**建议**：采用方案A，因为文件读写操作很快，同步操作不会阻塞。

### 2. 错误处理改进

**当前问题**：
```typescript
catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
```

**改进方案**：
```typescript
catch (e) {
  const err = e as Error;
  console.error(`错误: ${err.message}`);
  if (err.stack && process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
}
```

### 3. 文档一致性修复

**问题**：README 中代码示例缺少 `await`

**修复**：更新所有异步函数调用的示例，添加 `await`

## 🟡 中优先级（建议近期实现）

### 4. 统一技能安装函数

**当前**：
```typescript
if (platform === 'codex') {
  await installSkillToCodex();
} else {
  console.log('请手动安装...');
}
```

**改进**：
```typescript
export async function installSkill(platform: 'codex' | 'claude' | 'gemini'): Promise<void> {
  const skillDir = getAgentTeamsSkillDir();
  if (!fs.existsSync(skillDir)) {
    throw new Error('agent-teams 技能目录不存在');
  }

  switch (platform) {
    case 'codex':
      return installSkillToCodex();
    case 'claude':
      // TODO: 实现 installSkillToClaude
      throw new Error('Claude Code 技能安装暂未实现');
    case 'gemini':
      // TODO: 实现 installSkillToGemini
      throw new Error('Gemini 技能安装暂未实现');
  }
}
```

### 5. 添加技能检查功能

```typescript
export function isSkillInstalled(platform: 'codex' | 'claude' | 'gemini'): boolean {
  const installPath = getSkillInstallPath(platform);
  return fs.existsSync(installPath.replace(' (如果支持)', ''));
}
```

CLI 命令：
```bash
agent-teams check-skill codex
# 输出：已安装 / 未安装
```

### 6. 添加团队状态查看

```typescript
export function getTeamStatus(teamName: string): {
  members: number;
  runningTeammates: number;
  tasks: { pending: number; inProgress: number; completed: number };
}
```

CLI 命令：
```bash
agent-teams status my-team
# 输出：
# 成员: 3
# 运行中: 2
# 任务: 5 待处理, 2 进行中, 10 已完成
```

## 🟢 低优先级（可选改进）

### 7. 任务依赖验证

在 `addTask` 中添加验证：
```typescript
if (options?.dependencies) {
  const tasks = loadTasks(teamName);
  const invalidDeps = options.dependencies.filter(
    depId => !tasks.some(t => t.id === depId)
  );
  if (invalidDeps.length > 0) {
    throw new Error(`依赖的任务不存在: ${invalidDeps.join(', ')}`);
  }
}
```

### 8. CLI 改进

- 添加 `--help` 选项
- 添加 `--version` 选项
- 改进错误提示

### 9. 队友进程健康检查

添加定期检查机制，检测队友进程是否卡死：
```typescript
setInterval(() => {
  for (const [memberId, teammate] of runningTeammates) {
    // 检查进程是否还在运行
    if (teammate.process.killed) {
      // 处理已死亡的进程
    }
  }
}, 30000); // 每30秒检查一次
```

### 10. 持久化运行状态

将 `runningTeammates` 状态保存到文件，以便进程重启后恢复：
```typescript
// 保存到 ~/.agent-teams/running.json
{
  "team1": {
    "member1": { "pid": 12345, "startedAt": "..." }
  }
}
```

## 📝 实施建议

1. **立即修复**：高优先级问题（1-3）
2. **本周内**：中优先级问题（4-6）
3. **后续迭代**：低优先级问题（7-10）

## 🧪 测试建议

在实施改进前，建议添加：
- 单元测试（Jest/Vitest）
- 集成测试（CLI 命令测试）
- E2E 测试（完整工作流测试）
