#!/bin/bash

# 发布前检查脚本

set -e

echo "🔍 发布前检查..."

# 1. 检查是否在 git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ 错误: 不在 git 仓库中"
  exit 1
fi

# 2. 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  警告: 有未提交的更改"
  echo "建议先提交更改再发布"
  read -p "是否继续? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. 检查是否已登录 npm
if ! npm whoami > /dev/null 2>&1; then
  echo "❌ 错误: 未登录 npm"
  echo "请运行: npm login"
  exit 1
fi

# 4. 运行测试
echo "🧪 运行测试..."
npm run test:run

# 5. 构建
echo "🔨 构建项目..."
npm run build

# 6. 清理测试文件
echo "🧹 清理测试文件..."
npm run prepare:publish

# 7. 检查包内容
echo "📦 检查发布包内容..."
npm run publish:dry-run

echo "✅ 检查完成！可以发布。"
echo ""
echo "发布命令:"
echo "  npm run publish:patch   # 补丁版本 (0.1.0 → 0.1.1)"
echo "  npm run publish:minor   # 次要版本 (0.1.0 → 0.2.0)"
echo "  npm run publish:major   # 主要版本 (1.0.0 → 2.0.0)"
echo "  npm publish             # 手动发布当前版本"
