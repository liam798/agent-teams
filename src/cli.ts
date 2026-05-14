#!/usr/bin/env node

import { Command, InvalidArgumentError } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { homedir } from 'node:os';
import {
  createTeam,
  addTask,
  addTasks,
  listTasks,
  listTeams,
  loadTeamConfig,
  deleteTeam,
  spawnTeammate,
  spawnExistingTeammate,
  getRunningTeammates,
  shutdownTeammate,
  getAvailablePlatforms,
  setStorageRoot,
  getStorageRoot,
  getPackageRoot,
  installSkillToCodex,
  listAvailableSkills,
  getSkillInstallPath,
  skillExists,
  sendMessage,
  getAllMessages,
  getMessagesFor,
  getClaimableTasks,
  updateTaskStatus,
} from './index.js';
import type { AgentPlatform, TaskStatus } from './types.js';

const PLATFORMS: AgentPlatform[] = ['codex', 'claude', 'gemini'];
const STATUSES: TaskStatus[] = ['pending', 'in_progress', 'completed'];
const CONFIG_DIR = path.join(homedir(), '.agent-teams');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

interface GlobalOptions {
  json?: boolean;
  storage?: string;
}

interface CliConfig {
  storage?: string;
}

interface MemberInput {
  name: string;
  platform: AgentPlatform;
  description?: string;
  spawnPrompt?: string;
}

class CliError extends Error {
  constructor(
    message: string,
    readonly code = 'cli_error',
    readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

function readConfig(): CliConfig {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) as CliConfig;
  } catch {
    return {};
  }
}

function writeConfig(config: CliConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
}

function resolveStorageRoot(options: GlobalOptions): { root: string; source: 'flag' | 'env' | 'config' | 'default' } {
  if (options.storage) return { root: path.resolve(options.storage), source: 'flag' };
  if (process.env.AGENT_TEAMS_STORAGE) return { root: path.resolve(process.env.AGENT_TEAMS_STORAGE), source: 'env' };
  const config = readConfig();
  if (config.storage) return { root: path.resolve(config.storage), source: 'config' };
  return { root: getStorageRoot(), source: 'default' };
}

function applyStorage(program: Command): { root: string; source: 'flag' | 'env' | 'config' | 'default' } {
  const resolved = resolveStorageRoot(program.optsWithGlobals<GlobalOptions>());
  setStorageRoot(resolved.root);
  return resolved;
}

function wantsJson(program: Command): boolean {
  return Boolean(program.optsWithGlobals<GlobalOptions>().json);
}

function emit(program: Command, data: unknown, text?: string): void {
  if (wantsJson(program)) {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  } else {
    process.stdout.write(`${text ?? formatHuman(data)}\n`);
  }
}

function formatHuman(data: unknown): string {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
}

function parsePlatform(value: string): AgentPlatform {
  if (!PLATFORMS.includes(value as AgentPlatform)) {
    throw new InvalidArgumentError(`平台必须是: ${PLATFORMS.join(', ')}`);
  }
  return value as AgentPlatform;
}

function parseStatus(value: string): TaskStatus {
  if (!STATUSES.includes(value as TaskStatus)) {
    throw new InvalidArgumentError(`状态必须是: ${STATUSES.join(', ')}`);
  }
  return value as TaskStatus;
}

function parseLimit(value: string): number {
  const limit = Number.parseInt(value, 10);
  if (!Number.isFinite(limit) || limit < 1) {
    throw new InvalidArgumentError('limit 必须是大于 0 的整数');
  }
  return limit;
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isFinite(port) || port < 0 || port >= 65536) {
    throw new InvalidArgumentError(`无效端口: ${value}`);
  }
  return port;
}

function parseMember(value: string): MemberInput {
  const parts = value.split(':');
  const name = parts[0]?.trim();
  const platform = parts[1]?.trim();
  const description = parts.length > 2 ? parts.slice(2).join(':').trim() : undefined;
  if (!name || !platform || !PLATFORMS.includes(platform as AgentPlatform)) {
    throw new InvalidArgumentError(`成员格式应为 名称:平台[:职责]，平台可选: ${PLATFORMS.join(', ')}`);
  }
  return {
    name,
    platform: platform as AgentPlatform,
    ...(description ? { description } : {}),
  };
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8')) as T;
}

function getTaskOrThrow(teamName: string, taskId: string) {
  const task = listTasks(teamName).find((item) => item.id === taskId);
  if (!task) throw new CliError(`任务不存在: ${taskId}`, 'not_found', { teamName, taskId });
  return task;
}

function getTeamOrThrow(teamName: string) {
  const config = loadTeamConfig(teamName);
  if (!config) throw new CliError(`团队不存在: ${teamName}`, 'not_found', { teamName });
  return config;
}

async function getDoctor(program: Command) {
  const storage = applyStorage(program);
  let packageRoot: string | null = null;
  let packageRootOk = false;
  try {
    packageRoot = getPackageRoot();
    packageRootOk = true;
  } catch {
    packageRoot = null;
  }
  const availablePlatforms = await getAvailablePlatforms();
  return {
    ok: packageRootOk,
    version: await readPackageVersion(packageRoot),
    config: {
      path: CONFIG_PATH,
      exists: fs.existsSync(CONFIG_PATH),
    },
    auth: {
      required: false,
      source: 'not_required',
    },
    storage,
    packageRoot,
    platforms: {
      supported: PLATFORMS,
      available: availablePlatforms,
      missing: PLATFORMS.filter((platform) => !availablePlatforms.includes(platform)),
    },
    setup: packageRootOk
      ? []
      : ['设置 AGENT_TEAMS_ROOT 指向 agent-teams 包目录，或重新安装 agent-teams'],
  };
}

async function readPackageVersion(packageRoot: string | null): Promise<string | null> {
  if (!packageRoot) return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf-8')) as { version?: string };
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

function makeProgram(): Command {
  const program = new Command();
  const invokedName = path.basename(process.argv[1] ?? 'agent-teams');
  program
    .name(invokedName)
    .description('协调多个 AI Agent 作为团队协作，提供团队、任务、消息、技能和 Web UI 的可组合 CLI；短命令: teams')
    .option('--json', '输出稳定 JSON 到 stdout')
    .option('--storage <dir>', '存储根目录，默认 ~/.agent-teams，可由 AGENT_TEAMS_STORAGE 或 init 配置覆盖')
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .command('doctor')
    .description('检查安装、配置、存储目录、平台可用性与无需认证的运行状态')
    .action(async (options, command: Command) => {
      const data = await getDoctor(command);
      emit(command, data, [
        `agent-teams ${data.version ?? 'unknown'}`,
        `存储目录: ${data.storage.root} (${data.storage.source})`,
        `配置文件: ${data.config.exists ? data.config.path : '未创建'}`,
        `可用平台: ${data.platforms.available.length ? data.platforms.available.join(', ') : '无'}`,
        data.setup.length ? `待处理: ${data.setup.join('; ')}` : '状态: 可用',
      ].join('\n'));
    });

  program
    .command('init')
    .description('写入用户级 agent-teams 配置')
    .option('--storage <dir>', '默认存储根目录')
    .option('--dry-run', '只预览将写入的配置')
    .action((options: { storage?: string; dryRun?: boolean }, command: Command) => {
      const current = readConfig();
      const next: CliConfig = {
        ...current,
        ...(options.storage ? { storage: path.resolve(options.storage) } : {}),
      };
      if (!options.dryRun) writeConfig(next);
      emit(command, { ok: true, dryRun: Boolean(options.dryRun), path: CONFIG_PATH, config: next }, `配置${options.dryRun ? '预览' : '已写入'}: ${CONFIG_PATH}`);
    });

  addTeamCommands(program);
  addTaskCommands(program);
  addMemberCommands(program);
  addMessageCommands(program);
  addSkillCommands(program);
  addServerCommands(program);
  addRequestCommands(program);
  addLegacyCommands(program);

  return program;
}

function addTeamCommands(program: Command): void {
  const teams = program.command('teams').description('发现、读取、创建和删除团队');

  teams
    .command('list')
    .description('列出团队')
    .option('--limit <n>', '最多返回数量', parseLimit)
    .action((options: { limit?: number }, command: Command) => {
      applyStorage(command);
      const names = listTeams().slice(0, options.limit);
      const items = names.map((name) => {
        const config = loadTeamConfig(name);
        return { name, description: config?.description, memberCount: config?.members.length ?? 0, updatedAt: config?.updatedAt };
      });
      emit(command, { items, count: items.length }, items.length ? items.map((item) => `${item.name} (${item.memberCount} 成员)${item.description ? ` - ${item.description}` : ''}`).join('\n') : '暂无团队');
    });

  teams
    .command('get')
    .description('按团队名读取团队配置')
    .argument('<team>', '团队名')
    .action((teamName: string, options, command: Command) => {
      applyStorage(command);
      const config = getTeamOrThrow(teamName);
      emit(command, config, `团队: ${config.name}\n成员数: ${config.members.length}${config.description ? `\n职能: ${config.description}` : ''}`);
    });

  teams
    .command('resolve')
    .description('将团队名或模糊关键词解析为稳定团队名')
    .argument('<query>', '团队名或关键词')
    .action((query: string, options, command: Command) => {
      applyStorage(command);
      const items = listTeams()
        .filter((name) => name === query || name.includes(query))
        .map((name) => ({ name, exact: name === query }));
      emit(command, { items, count: items.length }, items.length ? items.map((item) => `${item.name}${item.exact ? ' (exact)' : ''}`).join('\n') : '未找到匹配团队');
    });

  teams
    .command('create')
    .description('创建团队')
    .argument('<team>', '团队名')
    .option('--desc <text>', '团队职能描述')
    .requiredOption('--member <name:platform[:desc]>', '团队成员，可重复', collect, [])
    .option('--dry-run', '只预览，不写入')
    .action((teamName: string, options: { desc?: string; member: string[]; dryRun?: boolean }, command: Command) => {
      applyStorage(command);
      const members = options.member.map(parseMember);
      if (options.dryRun) {
        emit(command, { ok: true, dryRun: true, team: { name: teamName, description: options.desc, members } }, `将创建团队: ${teamName}`);
        return;
      }
      createTeam({ name: teamName, members, ...(options.desc ? { description: options.desc } : {}) });
      const config = getTeamOrThrow(teamName);
      emit(command, { ok: true, team: config }, `已创建团队: ${teamName}，成员: ${members.map((member) => member.name).join(', ')}`);
    });

  teams
    .command('delete')
    .alias('cleanup')
    .description('删除团队配置、任务与信箱；若有运行中成员会拒绝')
    .argument('<team>', '团队名')
    .option('--dry-run', '只预览，不删除')
    .action((teamName: string, options: { dryRun?: boolean }, command: Command) => {
      applyStorage(command);
      const running = getRunningTeammates().filter((item) => item.teamName === teamName);
      if (running.length > 0) {
        throw new CliError(`请先关闭 ${running.length} 个运行中的队友`, 'running_members', { teamName, runningCount: running.length });
      }
      getTeamOrThrow(teamName);
      if (!options.dryRun) deleteTeam(teamName);
      emit(command, { ok: true, dryRun: Boolean(options.dryRun), teamName }, options.dryRun ? `可删除团队: ${teamName}` : `已删除团队: ${teamName}`);
    });
}

function addTaskCommands(program: Command): void {
  const tasks = program
    .command('tasks [team]')
    .description('读取、创建、认领和更新任务；兼容旧用法 agent-teams tasks <团队名>')
    .action((teamName: string | undefined, options, command: Command) => {
      if (!teamName) command.help();
      applyStorage(command);
      const items = listTasks(teamName);
      emit(command, { items, count: items.length }, items.length ? items.map((task) => `[${task.id}] ${task.status} ${task.assignee ?? '-'} ${task.title}`).join('\n') : '暂无任务');
    });

  tasks
    .command('list')
    .description('列出团队任务')
    .argument('<team>', '团队名')
    .option('--status <status>', '按状态过滤: pending | in_progress | completed', parseStatus)
    .option('--assignee <member-id>', '按成员 ID 过滤')
    .option('--limit <n>', '最多返回数量', parseLimit)
    .action((teamName: string, options: { status?: TaskStatus; assignee?: string; limit?: number }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      let items = listTasks(teamName);
      if (options.status) items = items.filter((task) => task.status === options.status);
      if (options.assignee) items = items.filter((task) => task.assignee === options.assignee);
      if (options.limit) items = items.slice(0, options.limit);
      emit(command, { items, count: items.length }, items.length ? items.map((task) => `[${task.id}] ${task.status} ${task.assignee ?? '-'} ${task.title}`).join('\n') : '暂无任务');
    });

  tasks
    .command('get')
    .description('读取单个任务')
    .argument('<team>', '团队名')
    .argument('<task-id>', '任务 ID')
    .action((teamName: string, taskId: string, options, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const task = getTaskOrThrow(teamName, taskId);
      emit(command, task, `[${task.id}] ${task.status} ${task.title}`);
    });

  tasks
    .command('add')
    .description('添加单个任务')
    .argument('<team>', '团队名')
    .argument('<title>', '任务标题')
    .option('--desc <text>', '任务描述')
    .option('--dep <task-id>', '依赖任务 ID，可重复', collect, [])
    .option('--dry-run', '只预览，不写入')
    .action(async (teamName: string, title: string, options: { desc?: string; dep: string[]; dryRun?: boolean }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const preview = { title, description: options.desc, dependencies: options.dep };
      if (options.dryRun) {
        emit(command, { ok: true, dryRun: true, teamName, task: preview }, `将添加任务: ${title}`);
        return;
      }
      const task = await addTask(teamName, title, { description: options.desc, dependencies: options.dep });
      emit(command, { ok: true, task }, `已添加任务: ${task.id} - ${task.title}`);
    });

  tasks
    .command('add-batch')
    .description('从 JSON 文件批量添加任务')
    .argument('<team>', '团队名')
    .requiredOption('--file <path>', 'JSON 文件: [{"title":"...","description":"...","dependencies":["id"]}]')
    .option('--dry-run', '只预览，不写入')
    .action(async (teamName: string, options: { file: string; dryRun?: boolean }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const items = readJsonFile<Array<{ title: string; description?: string; dependencies?: string[] }>>(options.file);
      if (options.dryRun) {
        emit(command, { ok: true, dryRun: true, teamName, items, count: items.length }, `将添加 ${items.length} 个任务`);
        return;
      }
      const created = await addTasks(teamName, items);
      emit(command, { ok: true, items: created, count: created.length }, `已添加 ${created.length} 个任务`);
    });

  tasks
    .command('claimable')
    .description('列出依赖已满足且可认领的任务')
    .argument('<team>', '团队名')
    .action((teamName: string, options, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const items = getClaimableTasks(teamName);
      emit(command, { items, count: items.length }, items.length ? items.map((task) => `[${task.id}] ${task.title}`).join('\n') : '暂无可认领任务');
    });

  tasks
    .command('set-status')
    .description('更新任务状态，可选设置 assignee')
    .argument('<team>', '团队名')
    .argument('<task-id>', '任务 ID')
    .argument('<status>', '状态', parseStatus)
    .option('--assignee <member-id>', '成员 ID；传空字符串可清空')
    .option('--dry-run', '只预览，不写入')
    .action(async (teamName: string, taskId: string, status: TaskStatus, options: { assignee?: string; dryRun?: boolean }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const current = getTaskOrThrow(teamName, taskId);
      const next = { ...current, status, ...(options.assignee !== undefined ? { assignee: options.assignee || undefined } : {}) };
      if (options.dryRun) {
        emit(command, { ok: true, dryRun: true, before: current, after: next }, `将更新任务: ${taskId} -> ${status}`);
        return;
      }
      const updated = await updateTaskStatus(teamName, taskId, status, options.assignee);
      if (!updated) throw new CliError(`任务不存在: ${taskId}`, 'not_found', { teamName, taskId });
      emit(command, { ok: true, task: updated }, `已更新任务: ${taskId} -> ${status}`);
    });
}

function addMemberCommands(program: Command): void {
  const members = program
    .command('members [team]')
    .description('读取成员并启动或停止队友进程；兼容旧用法 agent-teams members <团队名>')
    .action((teamName: string | undefined, options, command: Command) => {
      if (!teamName) command.help();
      applyStorage(command);
      const config = getTeamOrThrow(teamName);
      const running = getRunningTeammates();
      const runningIds = new Set(running.filter((item) => item.teamName === teamName).map((item) => item.memberId));
      const items = config.members.map((member) => ({ ...member, running: runningIds.has(member.id) }));
      emit(command, { teamName, items, count: items.length }, items.length ? items.map((member, index) => `${index + 1}. ${member.name} (${member.platform})\n   ID: ${member.id}\n   状态: ${member.running ? '运行中' : '已停止'}${member.description ? `\n   职责: ${member.description}` : ''}`).join('\n\n') : '暂无成员');
    });

  members
    .command('list')
    .description('列出团队成员')
    .argument('<team>', '团队名')
    .action((teamName: string, options, command: Command) => {
      applyStorage(command);
      const config = getTeamOrThrow(teamName);
      const running = getRunningTeammates().filter((item) => item.teamName === teamName);
      const runningIds = new Set(running.map((item) => item.memberId));
      const items = config.members.map((member) => ({ ...member, running: runningIds.has(member.id) }));
      emit(command, { teamName, items, count: items.length }, items.length ? items.map((member) => `${member.name} (${member.platform})\n  ID: ${member.id}\n  状态: ${member.running ? '运行中' : '已停止'}${member.description ? `\n  职责: ${member.description}` : ''}`).join('\n') : '暂无成员');
    });

  members
    .command('spawn')
    .description('临时添加并启动一个队友')
    .argument('<team>', '团队名')
    .argument('<name>', '队友名')
    .argument('<platform>', '平台', parsePlatform)
    .argument('<prompt>', '初始提示')
    .option('--cwd <dir>', '工作目录，默认当前目录')
    .action(async (teamName: string, name: string, platform: AgentPlatform, prompt: string, options: { cwd?: string }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const teammate = await spawnTeammate(teamName, { name, platform, spawnPrompt: prompt }, path.resolve(options.cwd ?? process.cwd()));
      emit(command, { ok: true, teammate }, `已启动队友: ${teammate.name} (${teammate.memberId})`);
    });

  members
    .command('run')
    .description('按团队配置启动所有成员并保持进程运行')
    .argument('<team>', '团队名')
    .option('--cwd <dir>', '工作目录，默认当前目录')
    .action(runTeamAction);

  members
    .command('stop')
    .description('停止当前 CLI 进程内已启动的队友')
    .argument('<member-id>', '成员 ID')
    .action((memberId: string, options, command: Command) => {
      applyStorage(command);
      shutdownTeammate(memberId);
      emit(command, { ok: true, memberId }, `已发送停止信号: ${memberId}`);
    });
}

function addMessageCommands(program: Command): void {
  const messages = program.command('messages').description('读取和发送团队信箱消息');

  messages
    .command('list')
    .description('列出团队消息')
    .argument('<team>', '团队名')
    .option('--to <recipient>', '只列出发给指定收件人的消息')
    .option('--since <iso-time>', '只列出该时间之后的消息')
    .option('--limit <n>', '最多返回数量', parseLimit)
    .action((teamName: string, options: { to?: string; since?: string; limit?: number }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const items = options.to
        ? getMessagesFor(teamName, options.to, { since: options.since, limit: options.limit })
        : getAllMessages(teamName, { since: options.since, limit: options.limit });
      emit(command, { items, count: items.length }, items.length ? items.map((message) => `[${message.id}] ${message.from} -> ${message.to}: ${message.body}`).join('\n') : '暂无消息');
    });

  messages
    .command('send')
    .description('发送团队信箱消息')
    .argument('<team>', '团队名')
    .requiredOption('--from <sender>', '发送者 ID')
    .requiredOption('--to <recipient>', '收件人 ID 或 lead')
    .option('--body <text>', '消息正文')
    .option('--body-file <path>', '从文件读取消息正文')
    .option('--type <type>', '消息类型: message | plan_approval | idle_notification', 'message')
    .option('--dry-run', '只预览，不写入')
    .action((teamName: string, options: { from: string; to: string; body?: string; bodyFile?: string; type: 'message' | 'plan_approval' | 'idle_notification'; dryRun?: boolean }, command: Command) => {
      applyStorage(command);
      getTeamOrThrow(teamName);
      const body = options.bodyFile ? fs.readFileSync(path.resolve(options.bodyFile), 'utf-8') : options.body;
      if (!body) throw new CliError('请通过 --body 或 --body-file 提供消息正文', 'invalid_input');
      if (options.dryRun) {
        emit(command, { ok: true, dryRun: true, message: { teamName, from: options.from, to: options.to, body, type: options.type } }, `将发送消息给: ${options.to}`);
        return;
      }
      const message = sendMessage(teamName, options.from, options.to, body, options.type);
      emit(command, { ok: true, message }, `已发送消息: ${message.id}`);
    });
}

function addSkillCommands(program: Command): void {
  const skills = program.command('skills').description('管理 agent-teams companion skill');

  skills
    .command('list')
    .description('列出随包提供的技能平台')
    .action((options, command: Command) => {
      const items = listAvailableSkills().map((platform) => ({ platform, installPath: getSkillInstallPath(platform as AgentPlatform) }));
      emit(command, { items, count: items.length }, items.length ? items.map((item) => `${item.platform}: ${item.installPath}`).join('\n') : '未找到可用技能');
    });

  skills
    .command('path')
    .description('显示某平台的技能安装路径')
    .argument('<platform>', '平台', parsePlatform)
    .action((platform: AgentPlatform, options, command: Command) => {
      const installPath = getSkillInstallPath(platform);
      emit(command, { platform, installPath }, installPath);
    });

  skills
    .command('install')
    .description('安装技能到指定 Agent 平台；Codex 支持自动安装')
    .argument('<platform>', '平台', parsePlatform)
    .option('--dry-run', '只预览，不安装')
    .action(async (platform: AgentPlatform, options: { dryRun?: boolean }, command: Command) => {
      if (!skillExists(platform)) throw new CliError(`技能不存在: ${platform}`, 'not_found', { platform });
      const installPath = getSkillInstallPath(platform);
      if (options.dryRun || platform !== 'codex') {
        emit(command, { ok: true, dryRun: Boolean(options.dryRun), platform, installPath, automatic: platform === 'codex' }, platform === 'codex' ? `将安装到: ${installPath}` : `${platform} 平台请手动复制到: ${installPath}`);
        return;
      }
      await installSkillToCodex();
      emit(command, { ok: true, platform, installPath }, `技能已安装到: ${installPath}`);
    });
}

function addServerCommands(program: Command): void {
  const server = program.command('server').description('启动 Web UI 服务器');

  server
    .command('start')
    .description('启动 Web UI 服务器')
    .option('--port <port>', '端口，默认 3000', parsePort, 3000)
    .option('--host <host>', '主机，默认 localhost', 'localhost')
    .action(async (options: { port: number; host: string }, command: Command) => {
      applyStorage(command);
      const { startWebServer } = await import('./server/index.js');
      await startWebServer(options.port, options.host);
      emit(command, { ok: true, url: `http://${options.host}:${options.port}` }, `Web UI 已启动: http://${options.host}:${options.port}`);
      process.on('SIGINT', () => {
        process.stderr.write('\n正在关闭服务器...\n');
        process.exit(0);
      });
      await new Promise(() => {});
    });
}

function addRequestCommands(program: Command): void {
  const request = program.command('request').description('只读 raw 逃生口，读取本地 agent-teams 资源');

  request
    .command('get')
    .description('读取 /storage、/platforms、/teams、/teams/<team>、/tasks/<team>、/messages/<team>')
    .argument('<path>', '资源路径')
    .action(async (resourcePath: string, options, command: Command) => {
      const storage = applyStorage(command);
      const normalized = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
      const parts = normalized.split('/').filter(Boolean);
      let data: unknown;
      if (normalized === '/storage') {
        data = storage;
      } else if (normalized === '/platforms') {
        data = { supported: PLATFORMS, available: await getAvailablePlatforms() };
      } else if (normalized === '/teams') {
        data = { items: listTeams() };
      } else if (parts[0] === 'teams' && parts[1]) {
        data = getTeamOrThrow(parts[1]);
      } else if (parts[0] === 'tasks' && parts[1]) {
        getTeamOrThrow(parts[1]);
        data = { items: listTasks(parts[1]) };
      } else if (parts[0] === 'messages' && parts[1]) {
        getTeamOrThrow(parts[1]);
        data = { items: getAllMessages(parts[1]) };
      } else {
        throw new CliError(`不支持的只读路径: ${resourcePath}`, 'unsupported_path', { path: resourcePath });
      }
      emit(command, data);
    });
}

function addLegacyCommands(program: Command): void {
  program
    .command('create <team>')
    .description('旧命令：创建团队')
    .option('--desc <text>', '团队职能描述')
    .requiredOption('--member <name:platform[:desc]>', '团队成员，可重复', collect, [])
    .action((teamName: string, options: { desc?: string; member: string[] }, command: Command) => {
      applyStorage(command);
      const members = options.member.map(parseMember);
      createTeam({ name: teamName, members, ...(options.desc ? { description: options.desc } : {}) });
      const config = getTeamOrThrow(teamName);
      emit(command, { ok: true, team: config }, `已创建团队: ${teamName}，成员: ${members.map((member) => member.name).join(', ')}`);
    });

  program
    .command('add-task <team> <title>')
    .description('旧命令：添加单个任务')
    .option('--desc <text>', '任务描述')
    .option('--dep <task-id>', '依赖任务 ID，可重复', collect, [])
    .action(async (teamName: string, title: string, options: { desc?: string; dep: string[] }, command: Command) => {
      applyStorage(command);
      const task = await addTask(teamName, title, { description: options.desc, dependencies: options.dep });
      emit(command, { ok: true, task }, `已添加任务: ${task.id} - ${title}`);
    });

  program
    .command('add-tasks <team>')
    .description('旧命令：从 JSON 文件批量添加任务')
    .requiredOption('--file <path>', 'JSON 文件')
    .action(async (teamName: string, options: { file: string }, command: Command) => {
      applyStorage(command);
      const items = readJsonFile<Array<{ title: string; description?: string; dependencies?: string[] }>>(options.file);
      const tasks = await addTasks(teamName, items);
      emit(command, { ok: true, items: tasks, count: tasks.length }, `已添加 ${tasks.length} 个任务`);
    });

  program
    .command('list')
    .description('旧命令：列出团队')
    .action((options, command: Command) => {
      applyStorage(command);
      const items = listTeams().map((name) => ({ name, config: loadTeamConfig(name) }));
      emit(command, { items, count: items.length }, items.length ? items.map((item) => `${item.name} (${item.config?.members.length ?? 0} 成员)${item.config?.description ? ` - ${item.config.description}` : ''}`).join('\n') : '暂无团队');
    });

  program
    .command('platforms')
    .description('旧命令：检查可用平台')
    .action(async (options, command: Command) => {
      const available = await getAvailablePlatforms();
      const data = { supported: PLATFORMS, available, missing: PLATFORMS.filter((platform) => !available.includes(platform)) };
      emit(command, data, `已安装且可用的平台: ${available.length ? available.join(', ') : '无'}\n支持的平台: ${PLATFORMS.join(', ')}`);
    });

  program.command('cleanup <team>').description('旧命令：删除团队').action((teamName: string, options, command: Command) => {
    applyStorage(command);
    const running = getRunningTeammates().filter((item) => item.teamName === teamName);
    if (running.length > 0) throw new CliError(`请先关闭 ${running.length} 个运行中的队友`, 'running_members', { teamName, runningCount: running.length });
    deleteTeam(teamName);
    emit(command, { ok: true, teamName }, `已清理团队: ${teamName}`);
  });

  program.command('spawn <team> <name> <platform> <prompt>').description('旧命令：启动临时队友').option('--cwd <dir>', '工作目录').action(async (teamName: string, name: string, platformRaw: string, prompt: string, options: { cwd?: string }, command: Command) => {
    applyStorage(command);
    const platform = parsePlatform(platformRaw);
    const teammate = await spawnTeammate(teamName, { name, platform, spawnPrompt: prompt }, path.resolve(options.cwd ?? process.cwd()));
    emit(command, { ok: true, teammate }, `已启动队友: ${teammate.name} (${teammate.memberId})`);
  });

  program.command('run <team>').description('旧命令：启动团队所有成员').option('--cwd <dir>', '工作目录').action(runTeamAction);

  program.command('ui').description('旧命令：启动 Web UI').option('--port <port>', '端口', parsePort, 3000).option('--host <host>', '主机', 'localhost').action(startLegacyServer);
  program.command('serve').description('旧命令：启动 Web UI').option('--port <port>', '端口', parsePort, 3000).option('--host <host>', '主机', 'localhost').action(startLegacyServer);
  program.command('install-skill <platform>').description('旧命令：安装技能').action(async (platformRaw: string, options, command: Command) => {
    const platform = parsePlatform(platformRaw);
    if (!skillExists(platform)) throw new CliError(`技能不存在: ${platform}`, 'not_found', { platform });
    if (platform === 'codex') await installSkillToCodex();
    emit(command, { ok: true, platform, installPath: getSkillInstallPath(platform) }, platform === 'codex' ? `技能已安装到: ${getSkillInstallPath(platform)}` : `${platform} 平台请手动复制到: ${getSkillInstallPath(platform)}`);
  });
  program.command('list-skills').description('旧命令：列出技能').action((options, command: Command) => {
    const skills = listAvailableSkills();
    emit(command, { items: skills, count: skills.length }, skills.length ? skills.map((skill) => `  - ${skill}: ${getSkillInstallPath(skill as AgentPlatform)}`).join('\n') : '未找到可用技能');
  });
  program.command('skill-path <platform>').description('旧命令：显示技能路径').action((platformRaw: string, options, command: Command) => {
    const platform = parsePlatform(platformRaw);
    emit(command, { platform, installPath: getSkillInstallPath(platform) }, getSkillInstallPath(platform));
  });
}

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

async function runTeamAction(teamName: string, options: { cwd?: string }, command: Command): Promise<void> {
  applyStorage(command);
  const config = getTeamOrThrow(teamName);
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const started = [];
  const errors: Array<{ member: string; error: string }> = [];
  for (const member of config.members) {
    try {
      started.push(await spawnExistingTeammate(teamName, member.id, cwd));
      process.stderr.write(`已启动 ${member.name} (${member.platform})\n`);
    } catch (error) {
      errors.push({ member: `${member.name} (${member.platform})`, error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (errors.length === config.members.length) {
    throw new CliError('所有成员都启动失败，请先修复平台配置', 'platform_unavailable', { errors });
  }
  emit(command, { ok: true, started, errors }, `已启动 ${started.length} 个队友。按 Ctrl+C 结束。`);
  process.on('SIGINT', () => {
    getRunningTeammates().forEach((item) => shutdownTeammate(item.memberId));
    process.exit(0);
  });
  await new Promise(() => {});
}

async function startLegacyServer(options: { port: number; host: string }, command: Command): Promise<void> {
  applyStorage(command);
  const { startWebServer } = await import('./server/index.js');
  await startWebServer(options.port, options.host);
  emit(command, { ok: true, url: `http://${options.host}:${options.port}` }, `Web UI 已启动: http://${options.host}:${options.port}`);
  process.on('SIGINT', () => {
    process.stderr.write('\n正在关闭服务器...\n');
    process.exit(0);
  });
  await new Promise(() => {});
}

function handleError(error: unknown, program: Command): void {
  const json = wantsJson(program);
  const err = error instanceof CliError
    ? { code: error.code, message: error.message, details: error.details ?? {} }
    : { code: 'unexpected_error', message: error instanceof Error ? error.message : String(error), details: {} };
  if (json) {
    process.stderr.write(`${JSON.stringify({ ok: false, error: err }, null, 2)}\n`);
  } else {
    process.stderr.write(`${err.message}\n`);
  }
  process.exitCode = 1;
}

const program = makeProgram();
program.parseAsync(process.argv).catch((error) => handleError(error, program));
