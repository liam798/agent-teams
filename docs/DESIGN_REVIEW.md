# Agent-Teams 设计审查报告

## 📋 审查范围

- 架构设计
- API 一致性
- 错误处理
- 代码质量
- 文档完整性
- 用户体验
- 扩展性

## ✅ 设计优点

1. **清晰的模块划分**：team、tasks、mailbox、platforms 分离良好
2. **类型安全**：TypeScript 类型定义完整
3. **通用技能设计**：`skills/agent-teams/` 适用于多平台
4. **文件锁机制**：任务认领使用文件锁防止竞态条件
5. **平台抽象**：`IAgentPlatform` 接口设计良好，易于扩展

## ⚠️ 发现的问题

### 1. API 一致性问题

**问题**：
- `createTeam()` 是同步的
- `addTask()` 是异步的
- `listTasks()` 是同步的

**影响**：用户可能困惑为什么有些函数需要 await，有些不需要。

**建议**：
```typescript
// 选项1: 全部异步（推荐）
export async function createTeam(options: CreateTeamOptions): Promise<void>
export async function listTasks(teamName: string): Promise<Task[]>

// 选项2: 保持现状，但明确文档说明
// 在 README 中说明哪些是同步，哪些是异步
```

### 2. 技能安装功能不完整

**问题**：
- `installSkillToCodex()` 只支持 Codex
- 其他平台（claude、gemini）需要手动安装
- 没有统一的 `installSkill(platform)` 函数

**当前代码**：
```typescript
if (platform === 'codex') {
  await installSkillToCodex();
} else {
  console.log('请手动安装...');
}
```

**建议**：
```typescript
export async function installSkill(platform: 'codex' | 'claude' | 'gemini'): Promise<void> {
  switch (platform) {
    case 'codex':
      return installSkillToCodex();
    case 'claude':
      return installSkillToClaude();
    case 'gemini':
      return installSkillToGemini();
  }
}
```

### 3. 错误处理不够健壮

**问题1**：`getPackageRoot()` 可能失败
```typescript
// 当前：抛出错误
throw new Error('无法找到 agent-teams 包根目录...');

// 建议：提供更好的 fallback 或提示
```

**问题2**：CLI 错误处理过于简单
```typescript
// 当前：
catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

// 建议：区分错误类型，提供更友好的错误信息
```

**问题3**：队友进程退出时没有错误处理
```typescript
proc.on('exit', (code) => {
  // 如果 code !== 0，应该记录错误或通知负责人
});
```

### 4. 代码质量问题

**问题1**：`getCurrentDir()` 使用 `@ts-ignore`
```typescript
// 当前：
// @ts-ignore - 在运行时可用
if (typeof __dirname !== 'undefined') {
  // @ts-ignore
  return __dirname;
}

// 建议：使用 import.meta.url（ESM）或更好的方式
```

**问题2**：`__dirname` 在 ESM 中不可用
- 当前代码试图在 ESM 模块中使用 `__dirname`
- 应该使用 `import.meta.url` 或 `fileURLToPath`

**建议修复**：
```typescript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### 5. 功能缺失

**缺失功能1**：技能卸载
```bash
agent-teams uninstall-skill codex
```

**缺失功能2**：检查技能是否已安装
```bash
agent-teams check-skill codex
# 输出：已安装 / 未安装
```

**缺失功能3**：技能更新
```bash
agent-teams update-skill codex
```

**缺失功能4**：团队状态查看
```bash
agent-teams status <团队名>
# 显示：成员数量、运行中的队友、任务统计等
```

### 6. 文档不一致

**问题1**：README 中 `addTask` 示例缺少 `await`
```typescript
// README 中：
addTask('dev-team', '实现用户模块', {...});

// 实际代码需要：
await addTask('dev-team', '实现用户模块', {...});
```

**问题2**：CLI 帮助信息不完整
- 缺少 `--help` 选项
- 缺少子命令的详细说明

### 7. 类型导出问题

**问题**：`index.ts` 中导出 `addTaskRaw` 和 `addTasksRaw`，命名容易混淆
```typescript
export {
  addTask as addTaskRaw,
  addTasks as addTasksRaw,
} from './tasks/TaskList.js';
```

**建议**：
- 要么不导出这些（如果不需要）
- 要么重命名为更清晰的名称，如 `addTaskInternal`

### 8. 存储路径硬编码

**问题**：`getSkillInstallPath` 中硬编码了路径
```typescript
case 'claude':
  return path.join(home, '.claude', 'skills', 'agent-teams') + ' (如果支持)';
```

**建议**：使用配置或环境变量

### 9. 队友进程管理

**问题1**：`runningTeammates` 是内存中的 Map，进程退出后丢失
- 如果主进程崩溃，无法恢复运行中的队友状态

**问题2**：没有进程健康检查
- 无法检测队友进程是否卡死

**建议**：
- 将运行状态持久化到文件
- 添加健康检查机制

### 10. 任务依赖验证

**问题**：添加任务时没有验证依赖的任务 ID 是否存在
```typescript
addTask('team', '任务2', { dependencies: ['nonexistent-task-id'] });
// 应该验证 nonexistent-task-id 是否存在
```

## 🔧 建议的改进

### 高优先级

1. **修复 ESM `__dirname` 问题**
   - 使用 `import.meta.url` 和 `fileURLToPath`

2. **统一 API 异步性**
   - 决定是全部异步还是保持现状并明确文档

3. **完善错误处理**
   - 添加错误类型
   - 提供更友好的错误信息

4. **修复文档不一致**
   - README 中的代码示例添加 `await`
   - 更新 CLI 帮助信息

### 中优先级

5. **完善技能安装功能**
   - 添加统一的 `installSkill()` 函数
   - 支持更多平台

6. **添加缺失功能**
   - 技能卸载
   - 技能检查
   - 团队状态查看

7. **改进队友进程管理**
   - 持久化运行状态
   - 添加健康检查

### 低优先级

8. **任务依赖验证**
   - 添加任务时验证依赖是否存在

9. **CLI 改进**
   - 添加 `--help` 选项
   - 改进错误提示

10. **性能优化**
    - 任务列表较大时的性能考虑

## 📊 代码质量评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐ | 模块划分清晰，扩展性好 |
| API 设计 | ⭐⭐⭐ | 基本良好，但有一致性问题 |
| 错误处理 | ⭐⭐ | 需要改进 |
| 代码质量 | ⭐⭐⭐ | 整体良好，但有技术债 |
| 文档完整性 | ⭐⭐⭐ | 基本完整，但有细节不一致 |
| 用户体验 | ⭐⭐⭐⭐ | CLI 和 API 都易于使用 |

## 🎯 总结

整体设计**良好**，核心功能完整，架构清晰。主要问题集中在：

1. **技术细节**：ESM `__dirname` 问题需要修复
2. **一致性**：API 异步性需要统一
3. **完整性**：错误处理和功能覆盖需要完善

建议优先修复高优先级问题，然后逐步完善中低优先级功能。
