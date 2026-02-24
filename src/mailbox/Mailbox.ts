import * as fs from 'node:fs';
import * as path from 'node:path';
import type { MailboxMessage } from '../types.js';
import { getMailboxDir } from '../utils/storage.js';

function messagePath(teamName: string, messageId: string): string {
  // 确保目录存在
  const dir = getMailboxDir(teamName);
  return path.join(dir, `${messageId}.json`);
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 发送消息
 */
export function sendMessage(
  teamName: string,
  from: string,
  to: string,
  body: string,
  type: MailboxMessage['type'] = 'message'
): MailboxMessage {
  const msg: MailboxMessage = {
    id: generateId(),
    from,
    to,
    body,
    createdAt: new Date().toISOString(),
    type,
  };
  const p = messagePath(teamName, msg.id);
  fs.writeFileSync(p, JSON.stringify(msg, null, 2), 'utf-8');
  return msg;
}

/**
 * 获取发给某收件人的所有消息（并可选按时间排序）
 */
export function getMessagesFor(
  teamName: string,
  to: string,
  options?: { since?: string; limit?: number }
): MailboxMessage[] {
  const dir = getMailboxDir(teamName);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const messages: MailboxMessage[] = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      const msg = JSON.parse(raw) as MailboxMessage;
      if (msg.to !== to) continue;
      if (options?.since && msg.createdAt < options.since) continue;
      messages.push(msg);
    } catch {
      // 忽略损坏文件
    }
  }
  messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (options?.limit) return messages.slice(-options.limit);
  return messages;
}

/**
 * 获取团队所有消息（负责人用）
 */
export function getAllMessages(
  teamName: string,
  options?: { since?: string; limit?: number }
): MailboxMessage[] {
  const dir = getMailboxDir(teamName);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  const messages: MailboxMessage[] = [];
  for (const f of files) {
    try {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      messages.push(JSON.parse(raw) as MailboxMessage);
    } catch {
      // ignore
    }
  }
  messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (options?.since) {
    const since = options.since;
    return messages.filter((m) => m.createdAt >= since);
  }
  if (options?.limit) return messages.slice(-options.limit);
  return messages;
}

/**
 * 删除已读/已处理消息（可选，用于清理）
 */
export function deleteMessage(teamName: string, messageId: string): void {
  const p = messagePath(teamName, messageId);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
