# Web UI 使用指南

Agent Teams 提供了可视化的 Web 界面来管理团队和任务。

## 启动 Web UI

```bash
agent-teams ui
```

或使用别名：

```bash
agent-teams serve
```

默认会在 `http://localhost:3000` 启动服务器，并自动打开浏览器。

### 自定义端口和主机

```bash
agent-teams ui --port 8080 --host 0.0.0.0
```

## 功能特性

### 1. 团队列表

- 查看所有团队
- 显示每个团队的成员数和任务统计
- 快速跳转到团队详情

### 2. 团队详情

- **任务看板**：拖拽式看板视图，显示待处理、进行中、已完成的任务
- **团队成员**：查看所有成员，启动/停止队友进程
- **实时更新**：通过 WebSocket 实时同步任务状态

### 3. 任务管理

- 查看任务详情（标题、描述、状态、负责人）
- 认领任务
- 完成任务
- 查看任务依赖关系

### 4. 队友管理

- 查看队友运行状态
- 启动/停止队友进程
- 查看队友平台信息

## 开发模式

### 前端开发

```bash
cd ui
npm install
npm run dev
```

前端开发服务器会在 `http://localhost:5173` 启动（Vite 默认端口）。

### 后端开发

后端代码在 `src/server/` 目录，修改后需要重新构建：

```bash
npm run build
```

## 构建

构建完整项目（包括前端）：

```bash
npm run build
```

这会：
1. 编译 TypeScript 后端代码
2. 构建前端 React 应用
3. 将前端构建产物输出到 `ui/dist/`

## 架构说明

- **后端**：Express + WebSocket（`src/server/`）
- **前端**：React + TypeScript + Vite（`ui/`）
- **API**：RESTful API + WebSocket 实时推送
- **数据存储**：文件系统（`~/.agent-teams/`）

## 故障排除

### 端口被占用

如果默认端口 3000 被占用，使用 `--port` 指定其他端口：

```bash
agent-teams ui --port 3001
```

### 前端未构建

如果访问 UI 时看到 404，确保已构建前端：

```bash
npm run build
```

### WebSocket 连接失败

检查浏览器控制台是否有 WebSocket 连接错误。确保：
- 服务器正在运行
- 防火墙允许 WebSocket 连接
- 浏览器支持 WebSocket

## 未来计划

- [ ] 任务依赖关系可视化
- [ ] 消息中心界面
- [ ] 统计图表
- [ ] 暗色模式切换
- [ ] 键盘快捷键支持
