# 发布指南

本指南说明如何将 agent-teams 发布到 npm。

## 📋 发布前检查清单

### 1. 代码质量

- [ ] 所有测试通过：`npm run test:run`
- [ ] 代码已编译：`npm run build`
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 错误（如果有配置）

### 2. 版本号

根据 [语义化版本](https://semver.org/) 更新版本号：

- **PATCH** (0.1.0 → 0.1.1): Bug 修复
- **MINOR** (0.1.0 → 0.2.0): 新功能，向后兼容
- **MAJOR** (1.0.0 → 2.0.0): 破坏性变更

### 3. 文档

- [ ] README.md 已更新
- [ ] CHANGELOG.md 已更新（如果使用）
- [ ] 代码注释完整

### 4. 配置文件

- [ ] `package.json` 中的版本号已更新
- [ ] `package.json` 中的 `repository` 字段已设置
- [ ] `.npmignore` 已配置正确

## 🚀 发布步骤

### 方式一：使用发布脚本（推荐）

发布脚本会自动执行所有检查步骤。

#### 发布补丁版本（0.1.0 → 0.1.1）

```bash
npm run publish:patch
```

这会自动：
1. ✅ 检查 git 状态
2. ✅ 检查 npm 登录状态
3. ✅ 运行测试
4. ✅ 编译代码
5. ✅ 清理测试文件
6. ✅ 更新版本号（patch）
7. ✅ 创建 git commit 和 tag
8. ✅ 发布到 npm
9. ✅ 推送到 git

#### 发布次要版本（0.1.0 → 0.2.0）

```bash
npm run publish:minor
```

#### 发布主要版本（1.0.0 → 2.0.0）

```bash
npm run publish:major
```

#### 发布次要版本（0.1.0 → 0.2.0）

```bash
npm run publish:minor
```

#### 发布主要版本（1.0.0 → 2.0.0）

```bash
npm run publish:major
```

### 方式二：手动发布

#### 0. 发布前检查（推荐）

```bash
npm run prepublish:check
```

这会检查：
- Git 状态
- npm 登录状态
- 运行测试
- 构建代码
- 清理测试文件

#### 1. 更新版本号

```bash
# 方式 A: 使用 npm version（推荐）
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 1.0.0 → 2.0.0

# 方式 B: 手动编辑 package.json
# 然后运行：
npm version --no-git-tag-version
```

#### 2. 构建和测试

```bash
npm run build
npm run test:run
```

#### 3. 检查发布内容

```bash
npm run publish:dry-run
```

这会显示将要发布的文件列表，不实际上传。

#### 4. 发布到 npm

```bash
# 首次发布
npm publish

# 后续发布
npm publish

# 发布 beta 版本
npm publish --tag beta

# 发布到特定 registry
npm publish --registry https://registry.npmjs.org/
```

#### 5. 创建 Git Tag 和推送

```bash
git tag v$(node -p "require('./package.json').version")
git push origin main
git push --tags
```

## 🔍 验证发布

### 1. 检查 npm 上的包

访问：`https://www.npmjs.com/package/agent-teams`

### 2. 测试安装

```bash
# 在新目录中测试安装
mkdir test-install
cd test-install
npm install agent-teams
npx agent-teams --help
```

### 3. 验证技能文件

```bash
# 检查技能文件是否包含在包中
npm pack agent-teams
tar -tzf agent-teams-*.tgz | grep skills
```

## 📝 发布脚本说明

### `publish:patch/minor/major`

自动版本管理和发布：
- 更新版本号
- 运行测试
- 编译代码
- 创建 git commit 和 tag
- 发布到 npm
- 推送到 git

### `publish:dry-run`

预览将要发布的文件，不实际上传。

### `prepublishOnly`

在 `npm publish` 之前自动运行：
- 编译代码
- 运行测试

## ⚠️ 注意事项

### 1. npm 账号

确保已登录 npm：

```bash
npm login
npm whoami  # 验证登录状态
```

### 2. 包名冲突

如果包名已被占用，需要：
- 使用不同的包名
- 或联系包所有者

### 3. 作用域包

如果要发布为作用域包（如 `@yourname/agent-teams`）：

```json
{
  "name": "@yourname/agent-teams",
  "publishConfig": {
    "access": "public"
  }
}
```

### 4. 私有包

如果要发布为私有包：

```json
{
  "publishConfig": {
    "access": "restricted"
  }
}
```

### 5. 撤销发布

如果发布错误，24 小时内可以撤销：

```bash
# 撤销特定版本
npm unpublish agent-teams@0.1.0

# 撤销整个包（72小时内）
npm unpublish agent-teams --force
```

⚠️ **注意**：撤销会影响其他用户，谨慎操作。

## 🔄 持续发布流程

### GitHub Actions 示例

创建 `.github/workflows/publish.yml`：

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run test:run
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## 📚 相关资源

- [npm 发布文档](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [语义化版本](https://semver.org/)
- [package.json 字段说明](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)
