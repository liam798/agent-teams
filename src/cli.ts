#!/usr/bin/env node

import * as fs from 'node:fs';
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
} from './index.js';
import type { AgentPlatform } from './types.js';
import {
  installSkillToCodex,
  listAvailableSkills,
  getSkillInstallPath,
  skillExists,
} from './utils/skills.js';

const TEAM_NAME = 'team';
const PLATFORMS: AgentPlatform[] = ['codex', 'claude', 'gemini'];

function usage(): void {
  console.log(`
agent-teams - 协调多平台 AI Agent 协作（Codex / Claude Code / Gemini）

用法:
  agent-teams create <团队名> [--member 名称:平台]...
  agent-teams add-task <团队名> <任务标题> [--desc 描述] [--dep 任务ID]...
  agent-teams add-tasks <团队名> --file <JSON文件>
  agent-teams tasks <团队名>
  agent-teams members <团队名>  查看团队成员详情
  agent-teams spawn <团队名> <队友名> <平台> <初始提示>
  agent-teams list
  agent-teams cleanup <团队名>
  agent-teams platforms
  agent-teams run <团队名> [--cwd 目录]
  agent-teams ui [--port 端口] [--host 主机]  启动 Web UI 服务器
  agent-teams serve [--port 端口] [--host 主机]  启动 Web UI 服务器（别名）
  agent-teams install-skill <平台>  安装技能到指定 Agent 平台
  agent-teams list-skills           列出可用的技能
  agent-teams skill-path <平台>     显示技能安装路径

选项:
  --member 名称:平台  添加成员（平台: codex | claude | gemini），可多次
  --desc 描述         任务描述
  --dep 任务ID        任务依赖，可多次
  --file 路径         批量任务 JSON: [{"title":"...","description":"...","dependencies":["id1"]}]
  --cwd 目录          工作目录，默认当前目录
  --storage 目录      存储根目录，默认 ~/.agent-teams
  --port 端口          Web UI 服务器端口，默认 3000
  --host 主机          Web UI 服务器主机，默认 localhost

示例:
  agent-teams create my-team --member 审查员:claude --member 架构师:codex
  agent-teams members my-team  查看团队成员详情
  agent-teams add-task my-team "审查 auth 模块" --desc "安全与性能"
  agent-teams spawn my-team 审查员 claude "审查 src/auth/ 的安全与性能，并报告发现"
  agent-teams tasks my-team
  agent-teams cleanup my-team
`);
}

function parseArgs(args: string[]): Record<string, string | string[] | boolean> {
  const out: Record<string, string | string[] | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (key === 'storage' || key === 'cwd' || key === 'desc' || key === 'file' || key === 'port' || key === 'host') {
        out[key] = args[++i] ?? '';
      } else if (key === 'dep' || key === 'member') {
        if (!out[key]) out[key] = [];
        (out[key] as string[]).push(args[++i] ?? '');
      } else {
        out[key] = true;
      }
    }
  }
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const positional = argv.filter((x) => !x.startsWith('--'));
  const opts = parseArgs(argv);

  if (opts.storage && typeof opts.storage === 'string') {
    setStorageRoot(opts.storage);
  }

  const cmd = positional[0];
  if (!cmd) {
    usage();
    process.exit(1);
  }

  try {
    switch (cmd) {
      case 'create': {
        const teamName = positional[1];
        if (!teamName) {
          console.error('请提供团队名');
          process.exit(1);
        }
        const members = (opts.member as string[]) || [];
        if (members.length === 0) {
          console.error('请至少添加一个成员，例如: --member 名称:claude');
          process.exit(1);
        }
        const memberList = members.map((m) => {
          const [name, platform] = m.split(':');
          if (!name || !platform || !PLATFORMS.includes(platform as AgentPlatform)) {
            throw new Error(`无效的成员格式或平台: ${m}，平台可选: ${PLATFORMS.join(', ')}`);
          }
          return { name: name.trim(), platform: platform as AgentPlatform };
        });
        createTeam({ name: teamName, members: memberList });
        console.log(`已创建团队: ${teamName}，成员: ${memberList.map((m) => m.name).join(', ')}`);
        break;
      }

      case 'add-task': {
        const teamName = positional[1];
        const title = positional[2];
        if (!teamName || !title) {
          console.error('用法: agent-teams add-task <团队名> <任务标题> [--desc 描述] [--dep 任务ID]...');
          process.exit(1);
        }
        const desc = opts.desc as string | undefined;
        const deps = (opts.dep as string[]) || [];
        const task = await addTask(teamName, title, { description: desc, dependencies: deps });
        console.log(`已添加任务: ${task.id} - ${title}`);
        break;
      }

      case 'add-tasks': {
        const teamName = positional[1];
        const filePath = opts.file as string;
        if (!teamName || !filePath) {
          console.error('用法: agent-teams add-tasks <团队名> --file <JSON文件>');
          process.exit(1);
        }
        const raw = fs.readFileSync(filePath, 'utf-8');
        const items = JSON.parse(raw) as Array<{ title: string; description?: string; dependencies?: string[] }>;
        const tasks = await addTasks(teamName, items);
        console.log(`已添加 ${tasks.length} 个任务`);
        break;
      }

      case 'tasks': {
        const teamName = positional[1];
        if (!teamName) {
          console.error('请提供团队名');
          process.exit(1);
        }
        const tasks = listTasks(teamName);
        if (tasks.length === 0) {
          console.log('暂无任务');
          break;
        }
        tasks.forEach((t) => {
          console.log(`[${t.id}] ${t.status} ${t.assignee ?? '-'} ${t.title}`);
        });
        break;
      }

      case 'members': {
        const teamName = positional[1];
        if (!teamName) {
          console.error('请提供团队名');
          process.exit(1);
        }
        const config = loadTeamConfig(teamName);
        if (!config) {
          console.error(`团队不存在: ${teamName}`);
          process.exit(1);
        }
        const running = getRunningTeammates();
        const runningMemberIds = new Set(running.filter(t => t.teamName === teamName).map(t => t.memberId));
        
        if (config.members.length === 0) {
          console.log('暂无成员');
          break;
        }
        
        console.log(`\n团队: ${teamName}`);
        console.log(`成员数: ${config.members.length}\n`);
        config.members.forEach((member, index) => {
          const isRunning = runningMemberIds.has(member.id);
          const status = isRunning ? '🟢 运行中' : '⚪ 已停止';
          console.log(`${index + 1}. ${member.name} (${member.platform})`);
          console.log(`   ID: ${member.id}`);
          console.log(`   状态: ${status}`);
          if (member.description) {
            console.log(`   职责: ${member.description}`);
          }
          console.log('');
        });
        break;
      }

      case 'spawn': {
        const [teamName, mateName, platform, prompt] = positional.slice(1);
        if (!teamName || !mateName || !platform || !prompt) {
          console.error('用法: agent-teams spawn <团队名> <队友名> <平台> <初始提示>');
          process.exit(1);
        }
        if (!PLATFORMS.includes(platform as AgentPlatform)) {
          console.error(`平台必须是: ${PLATFORMS.join(', ')}`);
          process.exit(1);
        }
        const cwd = (opts.cwd as string) || process.cwd();
        const t = await spawnTeammate(
          teamName,
          { name: mateName, platform: platform as AgentPlatform, spawnPrompt: prompt },
          cwd
        );
        console.log(`已启动队友: ${t.name} (${t.memberId})`);
        break;
      }

      case 'list': {
        const teams = listTeams();
        if (teams.length === 0) {
          console.log('暂无团队');
          break;
        }
        teams.forEach((name) => {
          const config = loadTeamConfig(name);
          console.log(`${name} (${config?.members.length ?? 0} 成员)`);
        });
        break;
      }

      case 'cleanup': {
        const teamName = positional[1];
        if (!teamName) {
          console.error('请提供团队名');
          process.exit(1);
        }
        const running = getRunningTeammates().filter((t) => t.teamName === teamName);
        if (running.length > 0) {
          console.error(`请先关闭 ${running.length} 个运行中的队友`);
          process.exit(1);
        }
        deleteTeam(teamName);
        console.log(`已清理团队: ${teamName}`);
        break;
      }

      case 'platforms': {
        const available = await getAvailablePlatforms();
        console.log('已安装且可用的平台:', available.length ? available.join(', ') : '无');
        console.log('支持的平台: codex, claude, gemini');
        
        // 诊断信息
        const allPlatforms: AgentPlatform[] = ['codex', 'claude', 'gemini'];
        const missing = allPlatforms.filter(p => !available.includes(p));
        if (missing.length > 0) {
          console.log('\n⚠️  以下平台不可用:');
          for (const p of missing) {
            if (p === 'codex') {
              console.log('  - codex: 请运行 "codex login" 配置 Codex CLI');
            } else if (p === 'gemini') {
              console.log('  - gemini: 请设置 GEMINI_API_KEY 环境变量');
            } else if (p === 'claude') {
              console.log('  - claude: 请安装 Claude Code CLI');
            }
          }
          console.log('\n详细配置指南: docs/PLATFORM_CONFIG.md');
        }
        break;
      }

      case 'run': {
        const teamName = positional[1];
        if (!teamName) {
          console.error('请提供团队名');
          process.exit(1);
        }
        const config = loadTeamConfig(teamName);
        if (!config) {
          console.error(`团队不存在: ${teamName}`);
          process.exit(1);
        }
        const cwd = (opts.cwd as string) || process.cwd();
        console.log(`正在为团队 ${teamName} 启动 ${config.members.length} 个队友...`);
        
        const errors: Array<{ member: string; error: string }> = [];
        for (const m of config.members) {
          try {
            await spawnExistingTeammate(teamName, m.id, cwd);
            console.log(`✅ ${m.name} (${m.platform}) 已启动`);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push({ member: `${m.name} (${m.platform})`, error: errorMsg });
            console.error(`❌ ${m.name} (${m.platform}) 启动失败: ${errorMsg}`);
          }
        }
        
        if (errors.length > 0) {
          console.error(`\n⚠️  ${errors.length} 个成员启动失败。`);
          console.error('\n请检查平台配置：');
          console.error('  1. Codex: 运行 "codex login"');
          console.error('  2. Gemini: 设置 GEMINI_API_KEY 环境变量');
          console.error('  3. 运行 "agent-teams platforms" 验证配置');
          console.error('\n详细配置指南: docs/PLATFORM_CONFIG.md');
          
          if (errors.length === config.members.length) {
            console.error('\n所有成员都启动失败，请先修复配置问题。');
            process.exit(1);
          }
        }
        
        if (errors.length < config.members.length) {
          console.log(`\n✅ ${config.members.length - errors.length} 个队友已启动。按 Ctrl+C 结束。`);
        }
        process.on('SIGINT', () => {
          getRunningTeammates().forEach((t) => shutdownTeammate(t.memberId));
          process.exit(0);
        });
        await new Promise(() => {}); // 保持进程
        break;
      }

      case 'install-skill': {
        const platform = positional[1] as 'codex' | 'claude' | 'gemini' | undefined;
        if (!platform || !['codex', 'claude', 'gemini'].includes(platform)) {
          console.error('请指定平台: codex | claude | gemini');
          process.exit(1);
        }
        if (!skillExists(platform)) {
          console.error(`技能不存在: ${platform}`);
          process.exit(1);
        }
        if (platform === 'codex') {
          await installSkillToCodex();
        } else {
          console.log(`\n${platform} 平台的技能安装路径:`);
          console.log(getSkillInstallPath(platform));
          console.log('\n请手动将技能目录复制到上述路径，或等待该平台支持自动安装。');
        }
        break;
      }

      case 'list-skills': {
        const skills = listAvailableSkills();
        if (skills.length === 0) {
          console.log('未找到可用技能');
        } else {
          console.log('可用的技能平台:');
          skills.forEach((s) => {
            const path = getSkillInstallPath(s as 'codex' | 'claude' | 'gemini');
            console.log(`  - ${s}: ${path}`);
          });
        }
        break;
      }

      case 'skill-path': {
        const platform = positional[1] as 'codex' | 'claude' | 'gemini' | undefined;
        if (!platform || !['codex', 'claude', 'gemini'].includes(platform)) {
          console.error('请指定平台: codex | claude | gemini');
          process.exit(1);
        }
        console.log(getSkillInstallPath(platform));
        break;
      }

      case 'ui':
      case 'serve': {
        const portStr = (opts.port as string) || '3000';
        const port = parseInt(portStr, 10);
        if (isNaN(port) || port < 0 || port >= 65536) {
          console.error(`无效的端口号: ${portStr}`);
          process.exit(1);
        }
        const host = (opts.host as string) || 'localhost';
        const { startWebServer } = await import('./server/index.js');
        await startWebServer(port, host);
        // 保持进程运行
        process.on('SIGINT', () => {
          console.log('\n正在关闭服务器...');
          process.exit(0);
        });
        await new Promise(() => {}); // 保持进程运行
        break;
      }

      default:
        usage();
        process.exit(1);
    }
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}

main();
