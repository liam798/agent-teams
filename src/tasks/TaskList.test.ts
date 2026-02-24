import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { setStorageRoot } from '../utils/storage.js';
import {
  addTask,
  addTasks,
  getTasks,
  claimTask,
  completeTask,
  getClaimableTasks,
  updateTaskStatus,
} from './TaskList.js';

describe('TaskList', () => {
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

  it('应该添加单个任务', async () => {
    const task = await addTask(teamName, '测试任务', {
      description: '这是一个测试任务',
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('测试任务');
    expect(task.status).toBe('pending');
    expect(task.description).toBe('这是一个测试任务');
  });

  it('应该批量添加任务', async () => {
    const tasks = await addTasks(teamName, [
      { title: '任务1' },
      { title: '任务2', description: '描述2' },
    ]);

    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('任务1');
    expect(tasks[1].title).toBe('任务2');
    expect(tasks[1].description).toBe('描述2');
  });

  it('应该获取任务列表', async () => {
    await addTask(teamName, '任务1');
    await addTask(teamName, '任务2');

    const tasks = getTasks(teamName);
    expect(tasks).toHaveLength(2);
  });

  it('应该认领任务', async () => {
    const task = await addTask(teamName, '可认领任务');
    const claimed = await claimTask(teamName, task.id, 'member-1');

    expect(claimed).not.toBeNull();
    expect(claimed?.status).toBe('in_progress');
    expect(claimed?.assignee).toBe('member-1');
  });

  it('应该完成任务', async () => {
    const task = await addTask(teamName, '待完成任务');
    await claimTask(teamName, task.id, 'member-1');
    const completed = await completeTask(teamName, task.id);

    expect(completed).not.toBeNull();
    expect(completed?.status).toBe('completed');
  });

  it('应该处理任务依赖', async () => {
    const task1 = await addTask(teamName, '任务1');
    const task2 = await addTask(teamName, '任务2', {
      dependencies: [task1.id],
    });

    // 任务2 应该不可认领（因为依赖未完成）
    const claimable = getClaimableTasks(teamName);
    expect(claimable.some((t) => t.id === task2.id)).toBe(false);

    // 完成任务1后，任务2应该可认领
    await completeTask(teamName, task1.id);
    const claimableAfter = getClaimableTasks(teamName);
    expect(claimableAfter.some((t) => t.id === task2.id)).toBe(true);
  });

  it('应该更新任务状态', async () => {
    const task = await addTask(teamName, '任务');
    const updated = await updateTaskStatus(
      teamName,
      task.id,
      'in_progress',
      'member-1'
    );

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('in_progress');
    expect(updated?.assignee).toBe('member-1');
  });

  it('应该防止重复认领', async () => {
    const task = await addTask(teamName, '任务');
    await claimTask(teamName, task.id, 'member-1');
    const secondClaim = await claimTask(teamName, task.id, 'member-2');

    expect(secondClaim).toBeNull(); // 应该失败，因为已被认领
  });
});
