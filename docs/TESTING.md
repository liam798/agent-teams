# 测试指南

## 快速开始

```bash
# 安装依赖
npm install

# 运行所有测试
npm test              # 监视模式
npm run test:run      # 单次运行
npm run test:coverage # 生成覆盖率报告
```

## 测试框架

项目使用 [Vitest](https://vitest.dev/) 作为测试框架，因为它：
- ✅ 原生支持 ESM（项目使用 `"type": "module"`）
- ✅ 与 Vite 生态系统集成良好
- ✅ 快速且功能强大
- ✅ 内置代码覆盖率支持

## 测试状态

✅ **所有测试通过**：28 个测试用例全部通过

```
Test Files  5 passed (5)
Tests  28 passed (28)
```

## 运行测试

### 运行所有测试（监视模式）

```bash
npm test
```

在监视模式下，修改代码后会自动重新运行相关测试。

### 运行所有测试（单次）

```bash
npm run test:run
```

适用于 CI/CD 环境。

### 运行测试并生成覆盖率报告

```bash
npm run test:coverage
```

覆盖率报告会生成在 `coverage/` 目录，包括：
- `coverage/index.html` - HTML 报告（在浏览器中打开）
- `coverage/coverage-final.json` - JSON 报告

## 测试结构

```
src/
├── utils/
│   ├── storage.ts
│   └── storage.test.ts        # 存储工具测试
├── tasks/
│   ├── TaskList.ts
│   └── TaskList.test.ts       # 任务列表测试
├── team/
│   ├── TeamConfig.ts
│   └── TeamConfig.test.ts     # 团队配置测试
├── mailbox/
│   ├── Mailbox.ts
│   └── Mailbox.test.ts        # 消息系统测试
└── platforms/
    ├── index.ts
    └── index.test.ts           # 平台适配器测试
```

## 编写测试

### 基本测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule.js';

describe('myFunction', () => {
  it('应该正确执行', () => {
    const result = myFunction('input');
    expect(result).toBe('expected-output');
  });
});
```

### 使用临时目录

对于需要文件系统操作的测试，使用临时目录：

```typescript
import { beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { setStorageRoot } from '../utils/storage.js';

describe('文件操作测试', () => {
  let testRoot: string;

  beforeEach(() => {
    testRoot = path.join(tmpdir(), `test-${Date.now()}`);
    setStorageRoot(testRoot);
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  it('应该创建文件', () => {
    // 测试代码
  });
});
```

### Mock 外部依赖

```typescript
import { vi } from 'vitest';

// Mock 函数
const mockFunction = vi.fn().mockReturnValue('mocked-value');

// Mock 模块
vi.mock('./external-module.js', () => ({
  externalFunction: vi.fn(),
}));
```

## 测试覆盖范围

### 单元测试

- ✅ 存储工具 (`storage.test.ts`)
- ✅ 任务列表 (`TaskList.test.ts`)
- ✅ 团队配置 (`TeamConfig.test.ts`)
- ✅ 消息系统 (`Mailbox.test.ts`)
- ✅ 平台适配器 (`platforms/index.test.ts`)

### 集成测试（待实现）

- CLI 命令测试
- 完整工作流测试
- 多平台集成测试

### E2E 测试（待实现）

- 端到端团队协作流程
- 实际 Agent 平台调用测试

## 测试最佳实践

1. **隔离性**：每个测试应该独立，不依赖其他测试的状态
2. **清理**：使用 `beforeEach` 和 `afterEach` 清理测试数据
3. **描述性**：测试名称应该清晰描述测试内容
4. **覆盖率**：目标覆盖率 > 80%
5. **速度**：测试应该快速执行

## 持续集成

在 CI/CD 中运行测试：

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:run
      - run: npm run test:coverage
```

## 调试测试

### VS Code 调试配置

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test", "--", "--run"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### 运行特定测试文件

```bash
npm test src/utils/storage.test.ts
```

### 运行匹配模式的测试

```bash
npm test -- -t "应该添加任务"
```

## 常见问题

### Q: 测试失败，提示找不到模块？

A: 确保使用 `.js` 扩展名导入：
```typescript
import { myFunction } from './myModule.js'; // ✅
import { myFunction } from './myModule';     // ❌
```

### Q: 如何测试异步函数？

A: 使用 `async/await`：
```typescript
it('应该处理异步操作', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Q: 如何测试错误情况？

A: 使用 `expect().toThrow()`：
```typescript
it('应该在无效输入时抛出错误', () => {
  expect(() => myFunction(null)).toThrow();
});
```

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [Vitest API 参考](https://vitest.dev/api/)
- [测试最佳实践](https://vitest.dev/guide/best-practices.html)
