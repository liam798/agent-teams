import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';

const DEFAULT_ROOT = path.join(homedir(), '.agent-teams');

let rootDir = DEFAULT_ROOT;

/**
 * 设置团队与任务存储根目录（默认 ~/.agent-teams）
 */
export function setStorageRoot(dir: string): void {
  rootDir = dir;
}

export function getStorageRoot(): string {
  return rootDir;
}

export function getTeamsDir(): string {
  const dir = path.join(rootDir, 'teams');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getTasksDir(): string {
  const dir = path.join(rootDir, 'tasks');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getTeamDir(teamName: string): string {
  const dir = path.join(getTeamsDir(), teamName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getTaskListDir(teamName: string): string {
  const dir = path.join(getTasksDir(), teamName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getMailboxDir(teamName: string): string {
  const dir = path.join(getTeamDir(teamName), 'mailbox');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function teamConfigPath(teamName: string): string {
  return path.join(getTeamDir(teamName), 'config.json');
}

export function taskListPath(teamName: string): string {
  return path.join(getTaskListDir(teamName), 'tasks.json');
}

export function taskLockPath(teamName: string): string {
  return path.join(getTaskListDir(teamName), '.lock');
}
