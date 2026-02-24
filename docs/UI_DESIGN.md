# 可视化团队管理页面方案分析

## 📋 需求分析

### 核心功能需求

1. **团队概览**
   - 显示所有团队列表
   - 团队基本信息（名称、成员数、任务统计）
   - 快速操作（创建、删除、查看详情）

2. **团队详情页**
   - 团队成员列表（名称、平台、状态）
   - 任务看板（待处理/进行中/已完成）
   - 任务依赖关系可视化
   - 实时状态更新

3. **任务管理**
   - 任务列表视图（表格/看板）
   - 任务详情（标题、描述、状态、依赖、负责人）
   - 创建/编辑/删除任务
   - 任务状态流转（pending → in_progress → completed）

4. **队友管理**
   - 启动/停止队友
   - 查看队友运行状态
   - 查看队友消息

5. **实时监控**
   - 任务进度统计
   - 队友运行状态
   - 消息通知

## 🏗️ 架构方案

### 方案对比

#### 方案 A：独立 Web 应用（推荐）

**架构**：
```
┌─────────────┐
│   Browser   │
│  (React/Vue)│
└──────┬──────┘
       │ HTTP/WebSocket
┌──────▼──────────────┐
│   Web Server        │
│  (Express/Fastify)  │
│  - REST API         │
│  - WebSocket Server │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  Agent-Teams API    │
│  (现有 TypeScript)  │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  File System        │
│  ~/.agent-teams/    │
└─────────────────────┘
```

**优点**：
- ✅ 独立部署，不影响现有 CLI
- ✅ 可扩展性强，易于添加新功能
- ✅ 支持多用户（未来可扩展）
- ✅ 现代化 UI/UX

**缺点**：
- ❌ 需要额外的服务器进程
- ❌ 增加项目复杂度

**技术栈**：
- **前端**：React + TypeScript + Tailwind CSS + Vite
- **后端**：Express/Fastify + TypeScript
- **实时通信**：WebSocket (ws/socket.io)
- **状态管理**：Zustand/Redux
- **图表**：Recharts/D3.js（任务依赖图）

#### 方案 B：CLI 内置 Web 服务器

**架构**：
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
┌──────▼──────────────┐
│  agent-teams serve  │
│  (内置 HTTP Server)  │
│  - 静态文件          │
│  - REST API         │
└──────┬──────────────┘
       │
┌──────▼──────────────┐
│  现有 API 模块      │
└─────────────────────┘
```

**优点**：
- ✅ 零配置，开箱即用
- ✅ 与 CLI 集成，统一入口
- ✅ 无需额外部署

**缺点**：
- ❌ CLI 工具变重
- ❌ 前端资源打包到 npm 包中
- ❌ 更新前端需要重新发布包

**技术栈**：
- **前端**：React + TypeScript + Tailwind CSS（打包为静态文件）
- **后端**：Node.js HTTP Server（内置）
- **命令**：`agent-teams serve` 或 `agent-teams ui`

#### 方案 C：Electron 桌面应用

**架构**：
```
┌─────────────────────┐
│   Electron App      │
│  ┌───────────────┐  │
│  │  React UI     │  │
│  └───────┬───────┘  │
│          │          │
│  ┌───────▼───────┐  │
│  │  Node.js API │  │
│  └───────┬───────┘  │
└──────────┼──────────┘
           │
┌──────────▼──────────┐
│  File System         │
└──────────────────────┘
```

**优点**：
- ✅ 原生桌面体验
- ✅ 直接访问文件系统
- ✅ 无需浏览器

**缺点**：
- ❌ 打包体积大
- ❌ 跨平台打包复杂
- ❌ 开发复杂度高

## 🎯 推荐方案：方案 A + 方案 B 混合

### 架构设计

**阶段 1：CLI 内置服务器（快速实现）**
- 使用方案 B，快速提供基础功能
- 命令：`agent-teams ui` 或 `agent-teams serve`
- 前端打包为静态文件，嵌入到 npm 包

**阶段 2：独立 Web 应用（长期规划）**
- 基于方案 A，提供更强大的功能
- 支持多用户、权限管理、历史记录等

### 技术选型

#### 前端技术栈

**核心框架**：
- **React 18** + **TypeScript** - 现代化 UI 框架
- **Vite** - 快速构建工具
- **React Router** - 路由管理

**UI 组件库**：
- **shadcn/ui** + **Tailwind CSS** - 现代化组件系统
- **Lucide React** - 图标库

**状态管理**：
- **Zustand** - 轻量级状态管理
- **React Query** - 数据获取和缓存

**可视化**：
- **Recharts** - 图表（任务统计）
- **React Flow** - 任务依赖关系图
- **React DnD** - 拖拽（看板视图）

**实时通信**：
- **WebSocket** (ws) - 实时状态更新

#### 后端技术栈

**Web 框架**：
- **Express** 或 **Fastify** - 轻量级 HTTP 服务器
- **TypeScript** - 类型安全

**API 设计**：
- **RESTful API** - 标准 REST 接口
- **WebSocket** - 实时推送

**文件访问**：
- 复用现有的 `src/` 模块
- 通过 API 封装，不直接暴露文件系统

## 📐 详细设计

### API 设计

#### REST API

```typescript
// 团队管理
GET    /api/teams                    // 获取所有团队
POST   /api/teams                    // 创建团队
GET    /api/teams/:name              // 获取团队详情
DELETE /api/teams/:name              // 删除团队

// 任务管理
GET    /api/teams/:name/tasks        // 获取任务列表
POST   /api/teams/:name/tasks        // 创建任务
PUT    /api/teams/:name/tasks/:id    // 更新任务
DELETE /api/teams/:name/tasks/:id    // 删除任务
POST   /api/teams/:name/tasks/:id/claim    // 认领任务
POST   /api/teams/:name/tasks/:id/complete  // 完成任务

// 队友管理
GET    /api/teams/:name/members      // 获取成员列表
POST   /api/teams/:name/members/:id/spawn   // 启动队友
POST   /api/teams/:name/members/:id/shutdown // 停止队友
GET    /api/teams/:name/members/:id/status   // 获取队友状态

// 消息系统
GET    /api/teams/:name/messages     // 获取消息列表
POST   /api/teams/:name/messages     // 发送消息

// 平台管理
GET    /api/platforms                // 获取可用平台
```

#### WebSocket 事件

```typescript
// 客户端 → 服务器
{
  type: 'subscribe',
  team: 'team-name'
}

// 服务器 → 客户端
{
  type: 'task:updated',
  team: 'team-name',
  task: Task
}

{
  type: 'teammate:status',
  team: 'team-name',
  memberId: string,
  status: 'running' | 'stopped'
}

{
  type: 'message:new',
  team: 'team-name',
  message: MailboxMessage
}
```

### 页面结构

```
/                          # 团队列表页
├── /teams/:name          # 团队详情页
│   ├── Overview          # 概览（统计、成员）
│   ├── Tasks             # 任务看板
│   ├── Dependencies      # 依赖关系图
│   └── Messages          # 消息中心
└── /settings             # 设置（存储路径、平台配置）
```

### UI 组件设计

#### 1. 团队列表页

```
┌─────────────────────────────────────────┐
│  Agent Teams                    [+ 新建]│
├─────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ Team 1   │ │ Team 2   │ │ Team 3   ││
│ │          │ │          │ │          ││
│ │ 👥 3 成员 │ │ 👥 2 成员 │ │ 👥 5 成员 ││
│ │ 📋 5 任务 │ │ 📋 8 任务 │ │ 📋 12 任务││
│ │          │ │          │ │          ││
│ │ [查看]   │ │ [查看]   │ │ [查看]   ││
│ └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

#### 2. 任务看板

```
┌──────────────┬──────────────┬──────────────┐
│   待处理     │   进行中     │   已完成     │
├──────────────┼──────────────┼──────────────┤
│ 📋 任务1     │ 📋 任务3     │ ✅ 任务2     │
│ 描述...      │ 👤 成员A     │              │
│ [认领]       │ [完成]       │              │
│              │              │              │
│ 📋 任务4     │              │ ✅ 任务5     │
│ 依赖: 任务2  │              │              │
└──────────────┴──────────────┴──────────────┘
```

#### 3. 依赖关系图

```
        [任务1: 设计]
           /    \
          /      \
    [任务2: 前端]  [任务3: 后端]
          \      /
           \    /
        [任务4: 测试]
```

### 数据流设计

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  React   │ ──────> │   API    │ ──────> │  File    │
│   UI     │ <────── │  Server  │ <────── │  System  │
└──────────┘         └──────────┘         └──────────┘
     │                    │
     │                    │
     └──── WebSocket ────┘
```

## 🚀 实施计划

### 阶段 1：MVP（最小可行产品）

**目标**：提供基础的团队和任务管理界面

**功能**：
- ✅ 团队列表
- ✅ 团队详情
- ✅ 任务列表（表格视图）
- ✅ 创建/编辑任务
- ✅ 任务状态更新

**时间估算**：2-3 周

### 阶段 2：增强功能

**目标**：添加看板视图和实时更新

**功能**：
- ✅ 任务看板（拖拽）
- ✅ WebSocket 实时更新
- ✅ 任务依赖关系图
- ✅ 队友管理界面

**时间估算**：2-3 周

### 阶段 3：高级功能

**目标**：完善用户体验

**功能**：
- ✅ 消息中心
- ✅ 统计图表
- ✅ 历史记录
- ✅ 导出功能

**时间估算**：1-2 周

## 📦 项目结构

```
agent-teams/
├── src/
│   ├── cli.ts              # CLI 入口（新增 ui 命令）
│   ├── server/             # Web 服务器（新增）
│   │   ├── index.ts        # 服务器入口
│   │   ├── routes/         # API 路由
│   │   │   ├── teams.ts
│   │   │   ├── tasks.ts
│   │   │   └── members.ts
│   │   ├── websocket.ts    # WebSocket 处理
│   │   └── middleware.ts   # 中间件
│   └── ...                 # 现有模块
├── ui/                     # 前端应用（新增）
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── TeamsList.tsx
│   │   │   ├── TeamDetail.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── TaskBoard.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── DependencyGraph.tsx
│   │   ├── store/          # Zustand stores
│   │   └── api/            # API 客户端
│   ├── package.json
│   └── vite.config.ts
├── package.json            # 主包配置
└── ...
```

## 🔧 技术细节

### 1. CLI 命令集成

```typescript
// src/cli.ts
case 'ui':
case 'serve': {
  const port = parseInt(opts.port as string) || 3000;
  const host = (opts.host as string) || 'localhost';
  await startWebServer(port, host);
  break;
}
```

### 2. 静态文件服务

```typescript
// src/server/index.ts
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, '../../ui/dist')));
```

### 3. API 路由封装

```typescript
// src/server/routes/teams.ts
import { Router } from 'express';
import { listTeams, loadTeamConfig, createTeam, deleteTeam } from '../../index.js';

const router = Router();

router.get('/', (req, res) => {
  const teams = listTeams();
  res.json(teams.map(name => ({
    name,
    ...loadTeamConfig(name),
  })));
});

export default router;
```

### 4. WebSocket 实时更新

```typescript
// src/server/websocket.ts
import { WebSocketServer } from 'ws';
import { watch } from 'fs';

const wss = new WebSocketServer({ server });

// 监听文件变化
watch(teamConfigPath, (eventType) => {
  if (eventType === 'change') {
    // 广播更新
    wss.clients.forEach(client => {
      client.send(JSON.stringify({
        type: 'team:updated',
        team: teamName,
      }));
    });
  }
});
```

## 📊 性能考虑

1. **文件监听**：使用 `fs.watch` 监听文件变化，避免轮询
2. **数据缓存**：使用 React Query 缓存 API 响应
3. **增量更新**：WebSocket 只推送变化的数据
4. **虚拟滚动**：任务列表使用虚拟滚动处理大量数据

## 🔒 安全考虑

1. **本地访问**：默认只监听 localhost
2. **CORS**：限制跨域请求
3. **文件权限**：确保只访问 `~/.agent-teams/` 目录
4. **输入验证**：所有 API 输入都要验证

## 📝 依赖项

### 新增依赖

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.14.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/ws": "^8.5.0"
  }
}
```

### UI 依赖（ui/package.json）

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.12.0",
    "recharts": "^2.10.0",
    "reactflow": "^11.10.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.3.0"
  }
}
```

## 🎨 UI/UX 设计原则

1. **简洁明了**：界面简洁，信息层次清晰
2. **实时反馈**：操作后立即显示结果
3. **响应式设计**：支持不同屏幕尺寸
4. **暗色模式**：支持明暗主题切换
5. **键盘快捷键**：提高操作效率

## 📚 参考资源

- [React Flow](https://reactflow.dev/) - 流程图组件
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Recharts](https://recharts.org/) - 图表库
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理

## ❓ 待决策问题

1. **端口配置**：默认端口？可配置？
2. **自动打开浏览器**：启动后是否自动打开？
3. **多团队同时管理**：是否需要标签页支持？
4. **数据导出**：是否需要导出为 JSON/CSV？
5. **历史记录**：是否需要任务历史记录？

## ✅ 下一步行动

1. **确认方案**：与团队确认技术选型和架构
2. **创建分支**：`feature/web-ui`
3. **搭建基础**：创建服务器和前端项目结构
4. **实现 MVP**：先实现团队列表和任务列表
5. **迭代优化**：根据反馈逐步完善功能
