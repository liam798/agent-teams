#!/bin/bash

echo "🧪 Agent Teams UI 测试脚本"
echo "================================"
echo ""

# 检查服务器是否运行
echo "1. 检查服务器状态..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 服务器正在运行"
else
    echo "❌ 服务器未运行，请先启动: npm run build && node dist/cli.js ui"
    exit 1
fi

echo ""
echo "2. 测试 API 端点..."
echo ""

# 测试获取团队列表
echo "📋 获取团队列表:"
TEAMS=$(curl -s http://localhost:3000/api/teams)
echo "$TEAMS" | python3 -m json.tool 2>/dev/null || echo "$TEAMS"
echo ""

# 测试获取平台列表
echo "🔧 获取可用平台:"
PLATFORMS=$(curl -s http://localhost:3000/api/platforms)
echo "$PLATFORMS" | python3 -m json.tool 2>/dev/null || echo "$PLATFORMS"
echo ""

# 如果有团队，测试获取团队详情
if [ -n "$TEAMS" ] && [ "$TEAMS" != "[]" ]; then
    TEAM_NAME=$(echo "$TEAMS" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['name'] if data else '')" 2>/dev/null)
    if [ -n "$TEAM_NAME" ]; then
        echo "📊 获取团队详情 ($TEAM_NAME):"
        TEAM_DETAIL=$(curl -s "http://localhost:3000/api/teams/$TEAM_NAME")
        echo "$TEAM_DETAIL" | python3 -m json.tool 2>/dev/null || echo "$TEAM_DETAIL"
        echo ""
        
        echo "📝 获取任务列表 ($TEAM_NAME):"
        TASKS=$(curl -s "http://localhost:3000/api/teams/$TEAM_NAME/tasks")
        echo "$TASKS" | python3 -m json.tool 2>/dev/null || echo "$TASKS"
        echo ""
        
        echo "👥 获取成员列表 ($TEAM_NAME):"
        MEMBERS=$(curl -s "http://localhost:3000/api/teams/$TEAM_NAME/members")
        echo "$MEMBERS" | python3 -m json.tool 2>/dev/null || echo "$MEMBERS"
        echo ""
    fi
fi

echo "3. 测试前端资源..."
echo ""

# 测试主要资源文件
RESOURCES=("/" "/assets/index-BEpul_4q.css" "/assets/index-DhSOPQL6.js")
for resource in "${RESOURCES[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$resource")
    if [ "$STATUS" = "200" ]; then
        echo "✅ $resource - HTTP $STATUS"
    else
        echo "❌ $resource - HTTP $STATUS"
    fi
done

echo ""
echo "4. 测试 WebSocket 连接..."
echo ""

# 简单的 WebSocket 测试（需要 websocat 或类似工具）
if command -v websocat &> /dev/null; then
    echo "使用 websocat 测试 WebSocket..."
    timeout 2 websocat ws://localhost:3000 2>&1 || echo "WebSocket 连接测试完成"
else
    echo "⚠️  未安装 websocat，跳过 WebSocket 测试"
    echo "   安装方法: brew install websocat (macOS)"
fi

echo ""
echo "================================"
echo "✅ 测试完成！"
echo ""
echo "🌐 在浏览器中访问: http://localhost:3000"
echo "📱 测试3D模式: 点击右上角的主题切换按钮"
