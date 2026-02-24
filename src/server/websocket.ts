import type { WebSocketServer } from 'ws';
import { watch } from 'node:fs';
import { taskListPath, teamConfigPath } from '../utils/storage.js';
import { listTeams } from '../index.js';

const subscriptions = new Map<string, Set<any>>(); // teamName -> Set<WebSocket>

export function setupWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws) => {
    console.log('WebSocket 客户端已连接');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          const teamName = data.team;
          if (!teamName) return;
          
          if (!subscriptions.has(teamName)) {
            subscriptions.set(teamName, new Set());
          }
          subscriptions.get(teamName)!.add(ws);
          
          // 发送确认
          ws.send(JSON.stringify({
            type: 'subscribed',
            team: teamName,
          }));
        } else if (data.type === 'unsubscribe') {
          const teamName = data.team;
          if (teamName && subscriptions.has(teamName)) {
            subscriptions.get(teamName)!.delete(ws);
          }
        }
      } catch (error) {
        console.error('WebSocket 消息解析错误:', error);
      }
    });

    ws.on('close', () => {
      // 清理订阅
      for (const [teamName, clients] of subscriptions.entries()) {
        clients.delete(ws);
        if (clients.size === 0) {
          subscriptions.delete(teamName);
        }
      }
    });
  });

  // 监听文件变化
  setupFileWatchers();
}

function setupFileWatchers(): void {
  // 监听所有团队的任务文件变化
  const teams = listTeams();
  
  for (const teamName of teams) {
    watchTaskFile(teamName);
    watchTeamConfig(teamName);
  }
}

function watchTaskFile(teamName: string): void {
  const filePath = taskListPath(teamName);
  
  try {
    watch(filePath, (eventType) => {
      if (eventType === 'change') {
        broadcastToTeam(teamName, {
          type: 'tasks:updated',
          team: teamName,
        });
      }
    });
  } catch (error) {
    // 文件可能不存在，忽略错误
  }
}

function watchTeamConfig(teamName: string): void {
  const filePath = teamConfigPath(teamName);
  
  try {
    watch(filePath, (eventType) => {
      if (eventType === 'change') {
        broadcastToTeam(teamName, {
          type: 'team:updated',
          team: teamName,
        });
      }
    });
  } catch (error) {
    // 文件可能不存在，忽略错误
  }
}

function broadcastToTeam(teamName: string, message: any): void {
  const clients = subscriptions.get(teamName);
  if (!clients) return;
  
  const messageStr = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(messageStr);
      } catch (error) {
        console.error('WebSocket 发送错误:', error);
      }
    }
  }
}

// 导出广播函数供其他模块使用
export function broadcastTaskUpdate(teamName: string, task: any): void {
  broadcastToTeam(teamName, {
    type: 'task:updated',
    team: teamName,
    task,
  });
}

/** 广播任务列表已更新（供路由在完成任务/认领/更新状态后调用，确保 UI 立即刷新） */
export function broadcastTasksUpdated(teamName: string): void {
  broadcastToTeam(teamName, {
    type: 'tasks:updated',
    team: teamName,
  });
}

export function broadcastTeammateStatus(teamName: string, memberId: string, status: string): void {
  broadcastToTeam(teamName, {
    type: 'teammate:status',
    team: teamName,
    memberId,
    status,
  });
}
