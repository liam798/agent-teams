import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { setStorageRoot } from '../utils/storage.js';
import {
  createTeamConfig,
  loadTeamConfig,
  addMember,
  listTeams,
  deleteTeam,
} from './TeamConfig.js';

describe('TeamConfig', () => {
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

  it('应该创建团队配置', () => {
    const config = createTeamConfig(teamName, [
      { name: '成员1', platform: 'claude' },
      { name: '成员2', platform: 'codex' },
    ]);

    expect(config.name).toBe(teamName);
    expect(config.members).toHaveLength(2);
    expect(config.members[0].name).toBe('成员1');
    expect(config.members[0].platform).toBe('claude');
  });

  it('应该加载团队配置', () => {
    createTeamConfig(teamName, [{ name: '成员1', platform: 'claude' }]);
    const loaded = loadTeamConfig(teamName);

    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe(teamName);
    expect(loaded?.members).toHaveLength(1);
  });

  it('应该添加成员到已有团队', () => {
    createTeamConfig(teamName, [{ name: '成员1', platform: 'claude' }]);
    const newMember = addMember(teamName, {
      name: '成员2',
      platform: 'codex',
    });

    expect(newMember.id).toBeDefined();
    expect(newMember.name).toBe('成员2');

    const config = loadTeamConfig(teamName);
    expect(config?.members).toHaveLength(2);
  });

  it('应该列出所有团队', () => {
    createTeamConfig('team1', [{ name: '成员1', platform: 'claude' }]);
    createTeamConfig('team2', [{ name: '成员1', platform: 'codex' }]);

    const teams = listTeams();
    expect(teams).toContain('team1');
    expect(teams).toContain('team2');
  });

  it('应该删除团队', () => {
    createTeamConfig(teamName, [{ name: '成员1', platform: 'claude' }]);
    expect(loadTeamConfig(teamName)).not.toBeNull();

    deleteTeam(teamName);
    expect(loadTeamConfig(teamName)).toBeNull();
  });

  it('应该处理不存在的团队', () => {
    const config = loadTeamConfig('nonexistent-team');
    expect(config).toBeNull();
  });
});
