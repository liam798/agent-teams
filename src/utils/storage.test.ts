import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import {
  setStorageRoot,
  getStorageRoot,
  getTeamsDir,
  getTasksDir,
  getTeamDir,
  teamConfigPath,
  taskListPath,
} from './storage.js';

describe('storage', () => {
  let testRoot: string;

  beforeEach(() => {
    // 使用临时目录进行测试
    testRoot = path.join(tmpdir(), `agent-teams-test-${Date.now()}`);
    setStorageRoot(testRoot);
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  it('应该设置和获取存储根目录', () => {
    expect(getStorageRoot()).toBe(testRoot);
  });

  it('应该创建 teams 目录', () => {
    const teamsDir = getTeamsDir();
    expect(fs.existsSync(teamsDir)).toBe(true);
    expect(fs.statSync(teamsDir).isDirectory()).toBe(true);
  });

  it('应该创建 tasks 目录', () => {
    const tasksDir = getTasksDir();
    expect(fs.existsSync(tasksDir)).toBe(true);
    expect(fs.statSync(tasksDir).isDirectory()).toBe(true);
  });

  it('应该创建团队目录', () => {
    const teamDir = getTeamDir('test-team');
    expect(fs.existsSync(teamDir)).toBe(true);
    expect(fs.statSync(teamDir).isDirectory()).toBe(true);
  });

  it('应该返回正确的配置文件路径', () => {
    const configPath = teamConfigPath('test-team');
    expect(configPath).toContain('test-team');
    expect(configPath).toContain('config.json');
  });

  it('应该返回正确的任务列表路径', () => {
    const taskPath = taskListPath('test-team');
    expect(taskPath).toContain('test-team');
    expect(taskPath).toContain('tasks.json');
  });
});
