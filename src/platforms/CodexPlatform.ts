import { spawn, type ChildProcess } from 'node:child_process';
import type { IAgentPlatform } from '../types.js';

/**
 * Codex (OpenAI) 平台：通过 @openai/codex 或系统 codex 命令调用
 * 文档：https://developers.openai.com/codex/cli
 */
export const CodexPlatform: IAgentPlatform = {
  name: 'codex',

  async checkAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('node:child_process');
      const fs = await import('node:fs');
      execSync('codex --version', { stdio: 'ignore' });
      
      // 检查 auth.json 是否存在（API key 存储在这里）
      const authPath = `${process.env.HOME || process.env.USERPROFILE}/.codex/auth.json`;
      if (fs.existsSync(authPath)) {
        try {
          // 验证 auth.json 包含有效的 API key
          const authContent = fs.readFileSync(authPath, 'utf-8');
          const auth = JSON.parse(authContent);
          if (auth.OPENAI_API_KEY && auth.OPENAI_API_KEY.trim().length > 0) {
            return true;
          }
        } catch {
          // auth.json 格式错误或无法解析
          return false;
        }
      }
      
      // auth.json 不存在或无效，但 CLI 已安装
      // 可能用户需要运行 codex login
      return false;
    } catch {
      return false;
    }
  },

  async spawn(options) {
    const { prompt, cwd, env } = options;
    // Codex CLI 的 -p 是 profile；prompt 需作为位置参数或通过 stdin 传入
    // 如果当前目录不在 git 仓库内，需跳过仓库检查
    let skipGitRepoCheck = false;
    try {
      const { execSync } = await import('node:child_process');
      execSync(`git -C "${cwd}" rev-parse --is-inside-work-tree`, { stdio: 'ignore' });
    } catch {
      skipGitRepoCheck = true;
    }

    const args = ['exec'];
    if (skipGitRepoCheck) args.push('--skip-git-repo-check');
    args.push(prompt);

    const child = spawn('codex', args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'inherit', 'pipe'], // 改为 'pipe' 以捕获 stderr
    });
    
    // 捕获启动错误（如 profile 配置问题）
    let errorOutput = '';
    const stderrHandler = (data: Buffer) => {
      errorOutput += data.toString();
      // 输出到控制台（因为 stdio 设置为 'pipe'）
      process.stderr.write(data);
      // 如果检测到 profile 错误，提供更友好的提示
      if (errorOutput.includes('profile') && errorOutput.includes('not found')) {
        console.error('\n❌ Codex 配置错误：找不到 profile 配置');
        console.error('请运行以下命令修复：');
        console.error('  1. codex logout');
        console.error('  2. codex login');
        console.error('\n详细配置指南: docs/PLATFORM_CONFIG.md\n');
      }
    };
    
    if (child.stderr) {
      child.stderr.on('data', stderrHandler);
    }
    
    return {
      process: child as ChildProcess,
      stdin: child.stdin!,
    };
  },

  sendMessage(stdin, message: string) {
    stdin.write(message.trim() + '\n');
  },
};
