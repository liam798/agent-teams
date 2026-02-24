# 发布到 npm - 快速指南

## 🚀 一键发布（推荐）

### 发布补丁版本（Bug 修复）

```bash
npm run publish:patch
```

### 发布次要版本（新功能）

```bash
npm run publish:minor
```

### 发布主要版本（破坏性变更）

```bash
npm run publish:major
```

## 📋 发布前准备

### 1. 登录 npm

```bash
npm login
npm whoami  # 验证登录状态
```

### 2. 更新 package.json

确保以下字段已填写：
- `repository.url` - GitHub 仓库地址
- `author` - 作者信息（可选）
- `version` - 版本号（会自动更新）

### 3. 检查发布内容

```bash
npm run publish:dry-run
```

这会显示将要发布的文件列表，不实际上传。

## ✅ 发布流程

发布脚本会自动执行：

1. ✅ **检查 Git 状态** - 确保代码已提交
2. ✅ **检查 npm 登录** - 确保已登录
3. ✅ **运行测试** - `npm run test:run`
4. ✅ **编译代码** - `npm run build`
5. ✅ **清理测试文件** - 移除 dist 中的测试文件
6. ✅ **更新版本号** - 根据类型（patch/minor/major）
7. ✅ **创建 Git Tag** - 自动创建版本标签
8. ✅ **发布到 npm** - `npm publish`
9. ✅ **推送到 Git** - 推送代码和标签

## 📦 发布包内容

发布包包含：
- ✅ `dist/` - 编译后的 JavaScript 和类型定义
- ✅ `skills/` - Skills 目录（供 Agent CLI 使用）
- ✅ `README.md` - 项目文档
- ❌ `src/` - 源代码（不包含）
- ❌ `*.test.*` - 测试文件（已清理）

**包大小**: ~20 KB（压缩后）
**文件数**: ~47 个文件

## 🔍 验证发布

### 1. 检查 npm 上的包

访问：`https://www.npmjs.com/package/agent-teams`

### 2. 测试安装

```bash
# 在新目录中测试
mkdir test-install && cd test-install
npm install agent-teams
npx agent-teams --help
```

### 3. 验证技能文件

```bash
npm pack agent-teams
tar -tzf agent-teams-*.tgz | grep skills
# 应该看到 skills/agent-teams/ 目录
```

## ⚠️ 注意事项

1. **首次发布**：确保包名 `agent-teams` 未被占用
2. **版本号**：遵循[语义化版本](https://semver.org/)
3. **撤销发布**：24 小时内可以 `npm unpublish`（谨慎使用）
4. **作用域包**：如需发布为 `@yourname/agent-teams`，修改 `package.json` 中的 `name`

## 📝 发布脚本说明

| 脚本 | 说明 |
|------|------|
| `npm run publish:patch` | 发布补丁版本（0.1.0 → 0.1.1） |
| `npm run publish:minor` | 发布次要版本（0.1.0 → 0.2.0） |
| `npm run publish:major` | 发布主要版本（1.0.0 → 2.0.0） |
| `npm run publish:dry-run` | 预览发布内容，不实际上传 |
| `npm run prepublish:check` | 运行发布前检查 |

## 🔄 CI/CD 发布

项目包含 GitHub Actions 工作流（`.github/workflows/publish.yml`），支持：

1. **通过 Release 触发**：创建 GitHub Release 时自动发布
2. **手动触发**：在 Actions 中选择版本类型手动发布

需要设置 `NPM_TOKEN` secret：
```bash
# 在 GitHub 仓库设置中添加 secret
Settings → Secrets → Actions → New repository secret
Name: NPM_TOKEN
Value: <你的 npm token>
```

## 📚 详细文档

- [完整发布指南](./RELEASE.md) - 详细步骤和故障排除
- [文档索引](./README.md) - 所有文档索引
- [npm 发布文档](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
