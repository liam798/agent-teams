import { spawn, type ChildProcess } from 'node:child_process';
import type { IAgentPlatform } from '../types.js';

/**
 * Claude Code 平台：通过 claude -p 非交互运行
 * 文档：https://code.claude.com/docs/headless
 */
export const ClaudeCodePlatform: IAgentPlatform = {
  name: 'claude',

  async checkAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('node:child_process');
      execSync('claude --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  },

  async spawn(options) {
    const { prompt, cwd, env } = options;
    const child = spawn(
      'claude',
      ['-p', prompt],
      {
        cwd,
        env: { ...process.env, ...env },
        stdio: ['pipe', 'inherit', 'inherit'],
      }
    );
    return {
      process: child as ChildProcess,
      stdin: child.stdin!,
    };
  },

  sendMessage(stdin, message: string) {
    stdin.write(message.trim() + '\n');
  },
};
