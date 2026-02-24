# 3D模式错误排查指南

## 常见错误及解决方案

### 1. "Cannot read properties of undefined (reading 'S')"

**原因**: React Three Fiber 无法正确识别 Three.js 对象

**解决方案**:
- ✅ 已修复：使用直接创建 Three.js 对象而不是 JSX 标签
- ✅ 已添加：错误边界组件捕获错误
- ✅ 已优化：使用 `useMemo` 缓存几何体和材质

### 2. 浏览器控制台错误检查

请打开浏览器开发者工具（F12），查看 Console 标签：

```javascript
// 检查 Three.js 是否加载
console.log(typeof THREE); // 应该输出 "object"

// 检查 React Three Fiber
console.log(typeof Canvas); // 应该输出 "function"
```

### 3. 测试步骤

1. **清除浏览器缓存**
   - Chrome/Edge: Ctrl+Shift+Delete (Windows) 或 Cmd+Shift+Delete (Mac)
   - 选择"缓存的图像和文件"
   - 点击"清除数据"

2. **访问页面**
   - 打开 http://localhost:3000
   - 等待页面完全加载

3. **切换到3D模式**
   - 点击右上角的"普通模式"按钮
   - 应该变成"3D模式"按钮

4. **进入团队详情页**
   - 点击任意团队卡片
   - 应该看到团队成员列表和3D场景

5. **检查3D场景**
   - 应该看到圆形排列的3D对象（八面体）
   - 每个对象代表一个团队成员
   - 可以拖拽旋转、滚轮缩放

### 4. 如果仍有错误

请提供以下信息：

1. **浏览器控制台的完整错误信息**
   - 包括错误堆栈（stack trace）
   - 截图或复制完整错误文本

2. **浏览器信息**
   - 浏览器类型和版本
   - 操作系统

3. **网络请求**
   - 打开 Network 标签
   - 检查是否有资源加载失败（红色）
   - 特别是 JavaScript 文件

4. **运行诊断脚本**
   ```bash
   ./debug-3d.sh
   ```

### 5. 手动测试3D组件

如果3D场景不显示，可以尝试：

1. **检查团队成员数据**
   ```bash
   curl http://localhost:3000/api/teams/android-dev-team/members
   ```
   应该返回成员列表

2. **检查浏览器控制台**
   - 查看是否有 WebGL 相关错误
   - 检查是否有 Three.js 加载错误

3. **尝试硬刷新**
   - Windows: Ctrl+F5
   - Mac: Cmd+Shift+R

### 6. 已知限制

- Three.js 库较大（>500KB），首次加载可能需要时间
- 需要现代浏览器支持 WebGL
- 某些旧设备可能性能较差

### 7. 回退方案

如果3D模式无法工作，可以：
- 使用普通模式（列表视图）
- 所有功能在普通模式下都可用
- 3D模式是额外的可视化功能

## 最新修复

✅ 修复了 `gridHelper` 的重复声明问题
✅ 添加了错误边界组件
✅ 优化了 Three.js 对象的创建方式
✅ 添加了 Canvas 创建回调用于调试

## 需要帮助？

如果问题仍然存在，请运行：
```bash
./debug-3d.sh
```

并提供浏览器控制台的完整错误信息。
