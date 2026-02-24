import * as fs from 'node:fs';
import type { TeamConfig as TeamConfigType, TeammateMember } from '../types.js';
import { getTeamsDir, getTaskListDir, getTeamDir, teamConfigPath } from '../utils/storage.js';

function generateId(): string {
  return `tm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * 读取团队配置
 */
export function loadTeamConfig(teamName: string): TeamConfigType | null {
  const p = teamConfigPath(teamName);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as TeamConfigType;
  } catch {
    return null;
  }
}

/**
 * 创建并保存团队配置
 */
export function createTeamConfig(
  teamName: string,
  members: Array<{
    name: string;
    platform: import('../types.js').AgentPlatform;
    description?: string;
    spawnPrompt?: string;
    platformOptions?: Record<string, unknown>;
  }>,
  teamDescription?: string
): TeamConfigType {
  const config: TeamConfigType = {
    name: teamName,
    ...(teamDescription ? { description: teamDescription } : {}),
    createdAt: now(),
    updatedAt: now(),
    members: members.map((m) => ({
      id: generateId(),
      name: m.name,
      platform: m.platform,
      description: m.description,
      spawnPrompt: m.spawnPrompt,
      platformOptions: m.platformOptions,
    })),
  };
  const p = teamConfigPath(teamName);
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

/**
 * 添加队友到已有团队
 */
export function addMember(
  teamName: string,
  member: Omit<TeammateMember, 'id'>
): TeammateMember {
  const config = loadTeamConfig(teamName);
  if (!config) throw new Error(`团队不存在: ${teamName}`);
  const newMember: TeammateMember = {
    ...member,
    id: generateId(),
  };
  config.members.push(newMember);
  config.updatedAt = now();
  fs.writeFileSync(
    teamConfigPath(teamName),
    JSON.stringify(config, null, 2),
    'utf-8'
  );
  return newMember;
}

/**
 * 更新团队配置（如 updatedAt）
 */
export function updateTeamConfig(
  teamName: string,
  updater: (config: TeamConfigType) => void
): TeamConfigType | null {
  const config = loadTeamConfig(teamName);
  if (!config) return null;
  updater(config);
  config.updatedAt = now();
  fs.writeFileSync(
    teamConfigPath(teamName),
    JSON.stringify(config, null, 2),
    'utf-8'
  );
  return config;
}

/**
 * 列出所有团队名
 */
export function listTeams(): string[] {
  const dir = getTeamsDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((name) =>
    fs.existsSync(teamConfigPath(name))
  );
}

/**
 * 删除团队（配置与任务目录）
 */
export function deleteTeam(teamName: string): void {
  const teamDir = getTeamDir(teamName);
  const taskDir = getTaskListDir(teamName);
  const rm = (p: string) => {
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
  };
  rm(teamDir);
  rm(taskDir);
}
