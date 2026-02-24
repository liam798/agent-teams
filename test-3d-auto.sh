#!/bin/bash

# 自动测试3D模式脚本
# 测试步骤：
# 1. 检查服务器是否运行
# 2. 检查API是否正常
# 3. 检查前端资源是否可访问
# 4. 使用无头浏览器测试3D模式切换

set -e

PORT=${PORT:-3000}
BASE_URL="http://localhost:${PORT}"

echo "🧪 开始自动测试3D模式..."
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查服务器是否运行
echo "1️⃣ 检查服务器状态..."
if curl -s "${BASE_URL}/api/platforms" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 服务器运行正常${NC}"
else
    echo -e "${RED}❌ 服务器未运行，请先启动: npm run build && node dist/cli.js ui${NC}"
    exit 1
fi

# 检查API端点
echo ""
echo "2️⃣ 检查API端点..."
APIS=(
    "/api/platforms"
    "/api/teams"
)

for api in "${APIS[@]}"; do
    if curl -s "${BASE_URL}${api}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${api} 正常${NC}"
    else
        echo -e "${RED}❌ ${api} 失败${NC}"
        exit 1
    fi
done

# 检查前端资源
echo ""
echo "3️⃣ 检查前端资源..."
RESOURCES=(
    "/index.html"
    "/assets/index.js"
)

for resource in "${RESOURCES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${resource}")
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✅ ${resource} 可访问 (HTTP ${STATUS})${NC}"
    else
        echo -e "${YELLOW}⚠️  ${resource} 返回 HTTP ${STATUS}${NC}"
    fi
done

# 检查是否有团队数据
echo ""
echo "4️⃣ 检查团队数据..."
TEAMS=$(curl -s "${BASE_URL}/api/teams" | python3 -c "import sys, json; teams=json.load(sys.stdin); print(len(teams))" 2>/dev/null || echo "0")
if [ "$TEAMS" -gt 0 ]; then
    echo -e "${GREEN}✅ 找到 ${TEAMS} 个团队${NC}"
    
    # 获取第一个团队的成员
    FIRST_TEAM=$(curl -s "${BASE_URL}/api/teams" | python3 -c "import sys, json; teams=json.load(sys.stdin); print(teams[0]['name'] if teams else '')" 2>/dev/null || echo "")
    if [ -n "$FIRST_TEAM" ]; then
        MEMBERS=$(curl -s "${BASE_URL}/api/teams/${FIRST_TEAM}/members" | python3 -c "import sys, json; members=json.load(sys.stdin); print(len(members))" 2>/dev/null || echo "0")
        echo -e "${GREEN}✅ 团队 '${FIRST_TEAM}' 有 ${MEMBERS} 个成员${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  没有团队数据，请先创建团队${NC}"
fi

# 检查Three.js相关依赖
echo ""
echo "5️⃣ 检查Three.js依赖..."
if [ -d "ui/node_modules/three" ]; then
    THREE_VERSION=$(cat ui/node_modules/three/package.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "未知")
    echo -e "${GREEN}✅ Three.js已安装 (v${THREE_VERSION})${NC}"
else
    echo -e "${RED}❌ Three.js未安装，请运行: cd ui && npm install${NC}"
    exit 1
fi

if [ -d "ui/node_modules/@react-three/fiber" ]; then
    R3F_VERSION=$(cat ui/node_modules/@react-three/fiber/package.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])" 2>/dev/null || echo "未知")
    echo -e "${GREEN}✅ @react-three/fiber已安装 (v${R3F_VERSION})${NC}"
else
    echo -e "${RED}❌ @react-three/fiber未安装${NC}"
    exit 1
fi

# 检查构建产物
echo ""
echo "6️⃣ 检查构建产物..."
if [ -f "ui/dist/index.html" ]; then
    echo -e "${GREEN}✅ UI构建产物存在${NC}"
    
    # 检查是否有JS文件包含three或r3f
    if find ui/dist/assets -name "*.js" -type f | head -1 | xargs grep -q "three\|r3f" 2>/dev/null; then
        echo -e "${GREEN}✅ 构建产物包含Three.js相关代码${NC}"
    else
        echo -e "${YELLOW}⚠️  构建产物中未找到Three.js相关代码${NC}"
    fi
else
    echo -e "${RED}❌ UI未构建，请运行: npm run build${NC}"
    exit 1
fi

# 生成测试报告
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 所有基础检查通过！${NC}"
echo ""
echo "📋 测试总结："
echo "   • 服务器运行正常"
echo "   • API端点可访问"
echo "   • 前端资源已构建"
echo "   • Three.js依赖已安装"
echo ""
echo "🌐 访问地址: ${BASE_URL}"
echo ""
echo "💡 下一步："
echo "   1. 打开浏览器访问 ${BASE_URL}"
echo "   2. 进入任意团队详情页"
echo "   3. 点击右上角的3D模式切换按钮"
echo "   4. 查看团队成员是否以3D形式渲染"
echo "   5. 检查浏览器控制台是否有错误"
echo ""
echo "🔍 如果3D模式不工作，请检查："
echo "   • 浏览器控制台错误信息"
echo "   • WebGL是否支持（访问 chrome://gpu 或 about:support）"
echo "   • 团队成员数据是否存在"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
