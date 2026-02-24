import type { ChildProcess } from 'node:child_process';
import type { CreateTeamOptions, SpawnTeammateOptions, Task } from '../types.js';
import { sendMessage } from '../mailbox/Mailbox.js';
import { getPlatform } from '../platforms/index.js';
import {
  createTeamConfig,
  loadTeamConfig,
  addMember as addConfigMember,
} from './TeamConfig.js';
import {
  addTask as addTaskItem,
  addTasks as addTaskItems,
  getTasks,
  getClaimableTasks,
  claimTask,
  completeTask,
  updateTaskStatus,
} from '../tasks/TaskList.js';
import { getTeamDir } from '../utils/storage.js';

export interface SpawnedTeammate {
  teamName: string;
  memberId: string;
  name: string;
  platform: import('../types.js').AgentPlatform;
  process: ChildProcess;
  stdin: NodeJS.WritableStream;
}

const runningTeammates = new Map<string, SpawnedTeammate>();

/**
 * 创建新团队
 */
export function createTeam(options: CreateTeamOptions): void {
  createTeamConfig(options.name, options.members);
}

/**
 * 向团队添加任务（可带依赖）
 */
export async function addTask(
  teamName: string,
  title: string,
  options?: { description?: string; dependencies?: string[] }
): Promise<Task> {
  return addTaskItem(teamName, title, options);
}

/**
 * 批量添加任务
 */
export async function addTasks(
  teamName: string,
  items: Array<{ title: string; description?: string; dependencies?: string[] }>
): Promise<Task[]> {
  return addTaskItems(teamName, items);
}

/**
 * 获取团队任务列表
 */
export function listTasks(teamName: string): Task[] {
  return getTasks(teamName);
}

/**
 * 获取可认领的任务
 */
export function listClaimableTasks(teamName: string): Task[] {
  return getClaimableTasks(teamName);
}

/**
 * 生成一个队友进程（由负责人调用）；会向团队配置添加新成员
 */
export async function spawnTeammate(
  teamName: string,
  options: SpawnTeammateOptions,
  cwd: string = process.cwd()
): Promise<SpawnedTeammate> {
  const config = loadTeamConfig(teamName);
  if (!config) throw new Error(`团队不存在: ${teamName}`);

  const platform = getPlatform(options.platform);
  const available = await platform.checkAvailable();
  if (!available) throw new Error(`平台不可用，请先安装: ${options.platform}`);

  const member = addConfigMember(teamName, {
    name: options.name,
    platform: options.platform,
    spawnPrompt: options.spawnPrompt,
    platformOptions: options.platformOptions,
  });

  return spawnTeammateInternal(teamName, member.id, {
    name: options.name,
    platform: options.platform,
    spawnPrompt: options.spawnPrompt,
    platformOptions: options.platformOptions,
  }, cwd);
}

/**
 * 根据已有成员 ID 启动队友（不新增成员），用于 run 命令
 */
export async function spawnExistingTeammate(
  teamName: string,
  memberId: string,
  cwd: string = process.cwd()
): Promise<SpawnedTeammate> {
  const config = loadTeamConfig(teamName);
  if (!config) throw new Error(`团队不存在: ${teamName}`);
  const member = config.members.find((m) => m.id === memberId);
  if (!member) throw new Error(`成员不存在: ${memberId}`);

  const platform = getPlatform(member.platform);
  const available = await platform.checkAvailable();
  if (!available) throw new Error(`平台不可用，请先安装: ${member.platform}`);

  return spawnTeammateInternal(teamName, member.id, {
    name: member.name,
    platform: member.platform,
    spawnPrompt: member.spawnPrompt,
    platformOptions: member.platformOptions,
  }, cwd);
}

async function spawnTeammateInternal(
  teamName: string,
  memberId: string,
  options: { name: string; platform: import('../types.js').AgentPlatform; spawnPrompt?: string; platformOptions?: Record<string, unknown> },
  cwd: string
): Promise<SpawnedTeammate> {
  const contextPrompt = buildTeammateContextPrompt(teamName, {
    name: options.name,
    platform: options.platform,
    spawnPrompt: options.spawnPrompt ?? `作为 ${options.name} 完成分配给你的任务。`,
    platformOptions: options.platformOptions,
  });
  const platform = getPlatform(options.platform);
  
  // 检查平台可用性
  const isAvailable = await platform.checkAvailable();
  if (!isAvailable) {
    if (options.platform === 'codex') {
      throw new Error(
        `Codex 平台不可用。请运行 "codex login" 配置 Codex CLI。\n` +
        `详细配置指南: docs/PLATFORM_CONFIG.md`
      );
    } else if (options.platform === 'gemini') {
      throw new Error(
        `Gemini 平台不可用。请设置 GEMINI_API_KEY 环境变量。\n` +
        `运行: export GEMINI_API_KEY="your-api-key"\n` +
        `详细配置指南: docs/PLATFORM_CONFIG.md`
      );
    } else {
      throw new Error(`平台 ${options.platform} 不可用。请检查安装和配置。`);
    }
  }
  
  const { process: proc, stdin } = await platform.spawn({
    prompt: contextPrompt,
    cwd,
    env: {
      AGENT_TEAMS_TEAM: teamName,
      AGENT_TEAMS_MEMBER_ID: memberId,
      AGENT_TEAMS_MODE: 'teammate',
    },
    platformOptions: options.platformOptions,
  });

  const spawned: SpawnedTeammate = {
    teamName,
    memberId,
    name: options.name,
    platform: options.platform,
    process: proc,
    stdin,
  };
  runningTeammates.set(memberId, spawned);

  proc.on('exit', (code) => {
    runningTeammates.delete(memberId);
    sendMessage(teamName, memberId, 'lead', `[${options.name}] 已退出，code=${code}`, 'idle_notification');
  });

  return spawned;
}

/**
 * 向队友发送消息（若其进程支持 stdin 输入）
 */
export function sendToTeammate(memberId: string, message: string): boolean {
  const t = runningTeammates.get(memberId);
  if (!t) return false;
  const platform = getPlatform(t.platform);
  if (platform.sendMessage) {
    platform.sendMessage(t.stdin, message);
    return true;
  }
  return false;
}

/**
 * 关闭队友（发送关闭请求后终止进程）
 */
export function shutdownTeammate(memberId: string): boolean {
  const t = runningTeammates.get(memberId);
  if (!t) return false;
  t.process.kill('SIGTERM');
  runningTeammates.delete(memberId);
  return true;
}

/**
 * 获取当前运行的队友
 */
export function getRunningTeammates(): SpawnedTeammate[] {
  return [...runningTeammates.values()];
}

/**
 * 队友认领任务（供队友进程内逻辑或外部协调器调用）
 */
export function teammateClaimTask(
  teamName: string,
  taskId: string,
  assigneeId: string
): Promise<Task | null> {
  return claimTask(teamName, taskId, assigneeId);
}

/**
 * 队友完成任务
 */
export function teammateCompleteTask(
  teamName: string,
  taskId: string
): Promise<Task | null> {
  return completeTask(teamName, taskId);
}

/**
 * 负责人分配任务
 */
export function assignTask(
  teamName: string,
  taskId: string,
  assigneeId: string
): Promise<Task | null> {
  return updateTaskStatus(teamName, taskId, 'in_progress', assigneeId);
}

/**
 * 构建队友启动时的上下文提示（任务列表、团队信息等）
 */
function buildTeammateContextPrompt(
  teamName: string,
  options: { name: string; spawnPrompt?: string; platform?: unknown; platformOptions?: unknown }
): string {
  const tasks = getClaimableTasks(teamName);
  const taskList =
    tasks.length > 0
      ? '当前可认领任务：\n' +
        tasks.map((t) => `- [${t.id}] ${t.title}`).join('\n')
      : '当前没有可认领的任务。';
  const teamDir = getTeamDir(teamName);
  return [
    `你正在以「${options.name}」身份参与 Agent Team「${teamName}」。`,
    `团队配置与任务列表位于: ${teamDir}`,
    '',
    taskList,
    '',
    '---',
    '',
    options.spawnPrompt ?? '',
  ].join('\n');
}

export {
  loadTeamConfig,
  listTeams,
  deleteTeam,
} from './TeamConfig.js';
export { getTasks, getClaimableTasks } from '../tasks/TaskList.js';
export * from '../mailbox/Mailbox.js';
