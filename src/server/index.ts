#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import teamsRouter from './routes/teams.js';
import tasksRouter from './routes/tasks.js';
import membersRouter from './routes/members.js';
import messagesRouter from './routes/messages.js';
import platformsRouter from './routes/platforms.js';
import { setupWebSocket } from './websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// CORS 配置
app.use(cors({
  origin: true,
  credentials: true,
}));

// JSON 解析
app.use(express.json());

// API 路由
app.use('/api/teams', teamsRouter);
app.use('/api/teams/:teamName/tasks', tasksRouter);
app.use('/api/teams/:teamName/members', membersRouter);
app.use('/api/teams/:teamName/messages', messagesRouter);
app.use('/api/platforms', platformsRouter);

// 静态文件服务（前端构建产物）
const uiDistPath = path.join(__dirname, '../../ui/dist');
app.use(express.static(uiDistPath));

// SPA 路由回退
app.get('*', (req: express.Request, res: express.Response) => {
  // 排除 API 路由
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(uiDistPath, 'index.html'));
});

// WebSocket 服务器
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

export function startWebServer(port: number = 3000, host: string = 'localhost'): Promise<void> {
  return new Promise(async (resolve) => {
    server.listen(port, host, async () => {
      const url = `http://${host}:${port}`;
      console.log(`\n🚀 Agent Teams UI 已启动`);
      console.log(`📱 访问地址: ${url}`);
      console.log(`\n按 Ctrl+C 停止服务器\n`);
      
      // 尝试自动打开浏览器
      try {
        const { exec } = await import('node:child_process');
        const platform = process.platform;
        const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${command} ${url}`, (error) => {
          if (error) {
            // 忽略错误，用户可手动打开浏览器
          }
        });
      } catch {
        // 忽略错误
      }
      
      resolve();
    });
  });
}
