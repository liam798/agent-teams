import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { setStorageRoot } from '../utils/storage.js';
import {
  sendMessage,
  getMessagesFor,
  getAllMessages,
  deleteMessage,
} from './Mailbox.js';

describe('Mailbox', () => {
  let testRoot: string;
  const teamName = 'test-team';

  beforeEach(() => {
    testRoot = path.join(tmpdir(), `agent-teams-test-${Date.now()}`);
    setStorageRoot(testRoot);
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  it('应该发送消息', () => {
    const msg = sendMessage(teamName, 'member-1', 'member-2', '测试消息');

    expect(msg.id).toBeDefined();
    expect(msg.from).toBe('member-1');
    expect(msg.to).toBe('member-2');
    expect(msg.body).toBe('测试消息');
  });

  it('应该获取发给特定收件人的消息', () => {
    const msg1 = sendMessage(teamName, 'member-1', 'member-2', '消息1');
    const msg2 = sendMessage(teamName, 'member-3', 'member-2', '消息2');
    sendMessage(teamName, 'member-1', 'member-3', '消息3');

    const messages = getMessagesFor(teamName, 'member-2');
    expect(messages.length).toBeGreaterThanOrEqual(2);
    // 检查消息内容（可能顺序不同）
    const bodies = messages.map((m) => m.body).sort();
    expect(bodies).toContain('消息1');
    expect(bodies).toContain('消息2');
  });

  it('应该获取所有消息', () => {
    sendMessage(teamName, 'member-1', 'member-2', '消息1');
    sendMessage(teamName, 'member-2', 'member-1', '消息2');

    const allMessages = getAllMessages(teamName);
    expect(allMessages.length).toBeGreaterThanOrEqual(2);
  });

  it('应该支持消息过滤（since）', async () => {
    const msg1 = sendMessage(teamName, 'member-1', 'member-2', '消息1');
    // 等待一小段时间确保时间戳不同
    await new Promise((resolve) => setTimeout(resolve, 10));
    const since = new Date().toISOString();
    const msg2 = sendMessage(teamName, 'member-1', 'member-2', '消息2');

    const messages = getMessagesFor(teamName, 'member-2', { since });
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages.some((m) => m.id === msg2.id)).toBe(true);
  });

  it('应该删除消息', () => {
    const msg = sendMessage(teamName, 'member-1', 'member-2', '测试消息');
    expect(getMessagesFor(teamName, 'member-2').length).toBeGreaterThan(0);

    deleteMessage(teamName, msg.id);
    const messagesAfter = getMessagesFor(teamName, 'member-2');
    expect(messagesAfter.some((m) => m.id === msg.id)).toBe(false);
  });
});
