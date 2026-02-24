#!/bin/bash

echo "🔍 3D模式错误诊断脚本"
echo "===================="
echo ""

echo "1. 检查服务器状态..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 服务器运行中"
else
    echo "❌ 服务器未运行"
    exit 1
fi

echo ""
echo "2. 检查API端点..."
API_RESPONSE=$(curl -s http://localhost:3000/api/teams)
if [ -n "$API_RESPONSE" ] && [ "$API_RESPONSE" != "[]" ]; then
    echo "✅ API响应正常"
    TEAM_COUNT=$(echo "$API_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    echo "   找到 $TEAM_COUNT 个团队"
else
    echo "⚠️  API响应为空或异常"
fi

echo ""
echo "3. 检查前端资源..."
for resource in "/assets/index-BEpul_4q.css" "/assets/index-DhSOPQL6.js"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$resource")
    if [ "$STATUS" = "200" ]; then
        echo "✅ $resource - HTTP $STATUS"
    else
        echo "❌ $resource - HTTP $STATUS"
    fi
done

echo ""
echo "4. 检查浏览器控制台错误..."
echo "   请在浏览器中打开开发者工具 (F12)"
echo "   查看 Console 标签页中的错误信息"
echo "   常见错误："
echo "   - 'Cannot read properties of undefined (reading 'S')'"
echo "   - 'THREE is not defined'"
echo "   - 'React Three Fiber' 相关错误"

echo ""
echo "5. 检查3D组件代码..."
if grep -q "new THREE.GridHelper" ui/src/components/Members3D.tsx 2>/dev/null; then
    echo "✅ GridHelper 使用正确"
else
    echo "⚠️  检查 GridHelper 实现"
fi

if grep -q "new THREE.OctahedronGeometry" ui/src/components/Members3D.tsx 2>/dev/null; then
    echo "✅ OctahedronGeometry 使用正确"
else
    echo "⚠️  检查 OctahedronGeometry 实现"
fi

echo ""
echo "6. 建议的修复步骤："
echo "   1. 清除浏览器缓存并刷新页面"
echo "   2. 检查浏览器控制台的完整错误信息"
echo "   3. 确认已切换到3D模式（点击右上角按钮）"
echo "   4. 确认有团队成员数据（进入团队详情页）"
echo "   5. 如果仍有错误，请提供浏览器控制台的完整错误堆栈"

echo ""
echo "===================="
echo "诊断完成"
