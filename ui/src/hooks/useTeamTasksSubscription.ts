import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_BASE =
  typeof location !== 'undefined'
    ? `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}`
    : '';

/**
 * 订阅当前团队的任务/团队变更，收到服务端推送时使 React Query 缓存失效，从而刷新任务列表与团队信息。
 * 解决「任务执行后状态没有变更」：后端完成任务会写文件并广播 tasks:updated，前端需据此 refetch。
 */
export function useTeamTasksSubscription(teamName: string | undefined) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedTeamRef = useRef<string | null>(null);

  useEffect(() => {
    if (!teamName || !WS_BASE) return;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        if (subscribedTeamRef.current === teamName) return;
        // 已连接但订阅了别的团队，先退订再订阅新区
        if (subscribedTeamRef.current) {
          wsRef.current.send(
            JSON.stringify({ type: 'unsubscribe', team: subscribedTeamRef.current })
          );
        }
      } else {
        const ws = new WebSocket(WS_BASE);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'subscribe', team: teamName }));
          subscribedTeamRef.current = teamName;
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data as string) as {
              type: string;
              team?: string;
            };
            if ((msg.type === 'tasks:updated' || msg.type === 'task:updated') && msg.team) {
              queryClient.invalidateQueries({ queryKey: ['tasks', msg.team] });
            }
            if (msg.type === 'team:updated' && msg.team) {
              queryClient.invalidateQueries({ queryKey: ['team', msg.team] });
              queryClient.invalidateQueries({ queryKey: ['teams'] });
            }
          } catch {
            // 忽略非 JSON 或解析错误
          }
        };

        ws.onclose = () => {
          subscribedTeamRef.current = null;
        };

        ws.onerror = () => {
          // 连接错误由 onclose 处理
        };
        return;
      }

      wsRef.current.send(JSON.stringify({ type: 'subscribe', team: teamName }));
      subscribedTeamRef.current = teamName;
    };

    connect();

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN && subscribedTeamRef.current) {
        wsRef.current.send(
          JSON.stringify({ type: 'unsubscribe', team: subscribedTeamRef.current })
        );
      }
      subscribedTeamRef.current = null;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [teamName, queryClient]);
}
