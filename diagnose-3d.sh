#!/bin/bash

echo "🔍 诊断3D模式问题..."
echo ""

# 检查服务器
echo "1. 检查服务器状态..."
if curl -s http://localhost:3000/api/platforms > /dev/null; then
    echo "   ✅ 服务器运行正常"
else
    echo "   ❌ 服务器未运行"
    exit 1
fi

# 检查API数据
echo ""
echo "2. 检查API数据..."
MEMBERS=$(curl -s http://localhost:3000/api/teams/android-dev-team/members | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data))" 2>/dev/null)
if [ "$MEMBERS" -gt 0 ]; then
    echo "   ✅ 找到 $MEMBERS 个成员"
    curl -s http://localhost:3000/api/teams/android-dev-team/members | python3 -c "import sys, json; data=json.load(sys.stdin); print('   第一个成员:', json.dumps(data[0], ensure_ascii=False))" 2>/dev/null
else
    echo "   ❌ 没有成员数据"
fi

# 检查构建产物
echo ""
echo "3. 检查构建产物..."
JS_FILE=$(ls /Volumes/Disk_APFS/Work/GithubProjects/agent-teams/ui/dist/assets/*.js 2>/dev/null | tail -1)
if [ -n "$JS_FILE" ]; then
    JS_NAME=$(basename "$JS_FILE")
    echo "   ✅ JS文件: $JS_NAME"
    echo "   文件大小: $(du -h "$JS_FILE" | cut -f1)"
    
    # 检查内容
    THREE_COUNT=$(grep -o "THREE\|three" "$JS_FILE" | wc -l | tr -d ' ')
    R3F_COUNT=$(grep -o "react-three\|@react-three" "$JS_FILE" | wc -l | tr -d ' ')
    MEMBERS3D_COUNT=$(grep -o "Members3D" "$JS_FILE" | wc -l | tr -d ' ')
    CANVAS_COUNT=$(grep -o "Canvas" "$JS_FILE" | wc -l | tr -d ' ')
    
    echo "   THREE出现: $THREE_COUNT 次"
    echo "   React Three Fiber出现: $R3F_COUNT 次"
    echo "   Members3D出现: $MEMBERS3D_COUNT 次"
    echo "   Canvas出现: $CANVAS_COUNT 次"
    
    if [ "$THREE_COUNT" -gt 0 ] && [ "$MEMBERS3D_COUNT" -gt 0 ]; then
        echo "   ✅ 代码已正确打包"
    else
        echo "   ⚠️  代码可能未正确打包"
    fi
else
    echo "   ❌ 未找到JS文件"
fi

# 检查依赖
echo ""
echo "4. 检查依赖..."
if [ -d "/Volumes/Disk_APFS/Work/GithubProjects/agent-teams/ui/node_modules/three" ]; then
    THREE_VERSION=$(cat /Volumes/Disk_APFS/Work/GithubProjects/agent-teams/ui/node_modules/three/package.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])" 2>/dev/null)
    echo "   ✅ Three.js已安装 (v$THREE_VERSION)"
else
    echo "   ❌ Three.js未安装"
fi

if [ -d "/Volumes/Disk_APFS/Work/GithubProjects/agent-teams/ui/node_modules/@react-three/fiber" ]; then
    R3F_VERSION=$(cat /Volumes/Disk_APFS/Work/GithubProjects/agent-teams/ui/node_modules/@react-three/fiber/package.json | python3 -c "import sys, json; print(json.load(sys.stdin)['version'])" 2>/dev/null)
    echo "   ✅ @react-three/fiber已安装 (v$R3F_VERSION)"
else
    echo "   ❌ @react-three/fiber未安装"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "诊断完成！"
echo ""
echo "如果代码已正确打包但仍无法显示，可能的原因："
echo "  1. 浏览器缓存问题 - 尝试硬刷新 (Ctrl+Shift+R)"
echo "  2. WebGL不支持 - 检查浏览器WebGL支持"
echo "  3. JavaScript运行时错误 - 查看浏览器控制台"
echo "  4. React组件渲染问题 - 检查组件条件渲染逻辑"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
