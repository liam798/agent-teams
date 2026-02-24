# 开发指南

本指南说明如何设置开发环境、运行项目、开发新功能和调试。

## 📋 前置条件

- **Node.js**: >= 18
- **npm**: >= 9（或 yarn/pnpm）
- **Git**: 用于版本控制

## 🚀 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/agent-teams.git
cd agent-teams
```

### 2. 安装依赖

```bash
npm install
```

### 3. 构建项目

```bash
npm run build
```

### 4. 运行测试

```bash
npm test              # 监视模式
npm run test:run      # 单次运行
```

## 🔧 开发工作流

### 开发模式

1. **修改源代码** (`src/` 目录)
2. **运行测试**（自动检测更改）
   ```bash
   npm test
   ```
3. **构建项目**
   ```bash
   npm run build
   ```
4. **测试 CLI**
   ```bash
   node dist/cli.js --help
   ```

### 使用 npm link 进行本地测试

在开发时，可以使用 `npm link` 将本地版本链接为全局命令：

```bash
# 在项目根目录
npm link

# 现在可以在任何地方使用 agent-teams
agent-teams --help
agent-teams platforms
```

取消链接：
```bash
npm unlink -g agent-teams
```

## 📁 项目结构

```
agent-teams/
├── src/                    # 源代码
│   ├── cli.ts             # CLI 入口
│   ├── index.ts           # 编程 API 导出
│   ├── types.ts           # 类型定义
│   ├── team/              # 团队管理
│   ├── tasks/             # 任务管理
│   ├── mailbox/           # 消息系统
│   ├── platforms/         # Agent 平台适配器
│   └── utils/             # 工具函数
├── dist/                   # 编译输出（gitignore）
├── skills/                 # Skills 目录
├── docs/                   # 文档
├── scripts/                # 构建脚本
├── package.json
└── tsconfig.json
```

## 🛠️ 开发任务

### 添加新功能

1. **创建功能分支**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **编写代码**
   - 在 `src/` 目录添加新文件
   - 遵循现有代码风格
   - 添加 TypeScript 类型

3. **编写测试**
   - 在对应目录创建 `*.test.ts` 文件
   - 运行 `npm test` 确保通过

4. **更新文档**
   - 更新 `README.md` 或 `docs/` 中的相关文档
   - 添加使用示例

5. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   ```

### 添加新平台支持

1. **创建平台适配器**
   ```typescript
   // src/platforms/NewPlatform.ts
   import type { IAgentPlatform } from '../types.js';
   
   export const NewPlatform: IAgentPlatform = {
     name: 'newplatform',
     async checkAvailable() { ... },
     async spawn(options) { ... },
     sendMessage(stdin, message) { ... },
   };
   ```

2. **注册平台**
   ```typescript
   // src/platforms/index.ts
   import { NewPlatform } from './NewPlatform.js';
   
   const platforms = {
     // ...
     newplatform: NewPlatform,
   };
   ```

3. **更新类型**
   ```typescript
   // src/types.ts
   export type AgentPlatform = 'codex' | 'claude' | 'gemini' | 'newplatform';
   ```

4. **添加测试**
   ```typescript
   // src/platforms/NewPlatform.test.ts
   ```

### 修改 CLI 命令

编辑 `src/cli.ts`：

1. 添加新的命令处理逻辑
2. 更新 `usage()` 函数
3. 更新 `parseArgs()` 如果需要新参数
4. 添加测试（如果可能）

## 🧪 测试

### 运行测试

```bash
# 监视模式（开发时）
npm test

# 单次运行
npm run test:run

# 生成覆盖率报告
npm run test:coverage
```

### 编写测试

测试文件命名：`*.test.ts` 或 `*.spec.ts`

示例：
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule.js';

describe('myFunction', () => {
  it('应该正确执行', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

详见：[测试指南](./TESTING.md)

## 🐛 调试

### VS Code 调试

项目已配置 VS Code 调试：

1. 打开 VS Code
2. 按 `F5` 或点击"运行和调试"
3. 选择 "Debug Tests" 或 "Debug Current Test File"

配置文件：`.vscode/launch.json`

### 调试 CLI

```bash
# 使用 Node.js 调试器
node --inspect-brk dist/cli.js create my-team --member test:claude

# 或使用 VS Code
# 在 cli.ts 中设置断点，然后运行调试配置
```

### 调试测试

```bash
# 运行特定测试文件
npm test src/utils/storage.test.ts

# 运行匹配模式的测试
npm test -- -t "应该添加任务"
```

## 🔨 构建

### 开发构建

```bash
npm run build
```

### 监视模式构建

```bash
npm run build:watch
# 或
npm run dev
```

### 清理构建

```bash
npm run clean
```

### 检查构建输出

```bash
ls -la dist/
```

## 📝 代码规范

### TypeScript

- 使用严格模式（`strict: true`）
- 所有函数添加类型注解
- 使用 `import type` 导入类型

### 文件命名

- 使用 kebab-case：`my-module.ts`
- 测试文件：`my-module.test.ts`

### 导出

- 使用命名导出：`export function myFunction() {}`
- 类型导出：`export type { MyType }`

## 🔄 开发工作流示例

### 添加新 CLI 命令

1. **修改 `src/cli.ts`**
   ```typescript
   case 'new-command': {
     // 实现逻辑
     break;
   }
   ```

2. **更新帮助信息**
   ```typescript
   function usage() {
     console.log(`
       agent-teams new-command <参数>
     `);
   }
   ```

3. **测试**
   ```bash
   npm run build
   node dist/cli.js new-command
   ```

4. **提交**
   ```bash
   git add src/cli.ts
   git commit -m "feat: 添加 new-command 命令"
   ```

### 修改平台适配器

1. **编辑平台文件**
   ```typescript
   // src/platforms/CodexPlatform.ts
   export const CodexPlatform: IAgentPlatform = {
     // 修改实现
   };
   ```

2. **运行测试**
   ```bash
   npm test src/platforms/
   ```

3. **测试实际调用**
   ```bash
   npm run build
   node dist/cli.js platforms  # 检查平台可用性
   ```

## 🚢 发布前检查

发布前运行：

```bash
npm run prepublish:check
```

这会检查：
- ✅ Git 状态
- ✅ npm 登录状态
- ✅ 测试通过
- ✅ 代码编译
- ✅ 测试文件清理

## 📚 相关文档

- [测试指南](./TESTING.md) - 详细的测试说明
- [架构文档](./ARCHITECTURE.md) - 系统架构
- [发布指南](./PUBLISH.md) - 如何发布到 npm

## 💡 开发技巧

### 1. 使用 npm link 测试

```bash
# 在项目目录
npm link

# 在其他目录测试
agent-teams --help
```

### 2. 快速迭代

```bash
# 终端1: 监视模式测试
npm test

# 终端2: 监视模式构建
npm run build:watch
```

### 3. 检查类型错误

```bash
npm run build
# TypeScript 会报告所有类型错误
```

### 4. 查看编译后的代码

```bash
cat dist/cli.js | head -50
```

## ❓ 常见问题

### Q: 修改代码后需要重新构建吗？

A: 是的，TypeScript 需要编译。运行 `npm run build` 或使用 `npm run build:watch` 监视模式。

### Q: 如何添加新的依赖？

A: 
```bash
npm install <package-name>        # 运行时依赖
npm install -D <package-name>    # 开发依赖
```

### Q: 如何查看编译后的文件？

A: 
```bash
ls -la dist/
cat dist/index.js
```

### Q: 测试失败怎么办？

A: 
1. 检查错误信息
2. 运行 `npm run build` 确保代码已编译
3. 检查测试文件路径和导入

### Q: 如何调试特定功能？

A: 
1. 在代码中添加 `console.log`
2. 使用 VS Code 调试器
3. 运行 `node --inspect dist/cli.js <command>`

### Q: 如何运行本地开发版本？

A: 
```bash
# 方式1: 使用 npm link
npm link
agent-teams --help

# 方式2: 直接运行编译后的文件
npm run build
node dist/cli.js --help
```
