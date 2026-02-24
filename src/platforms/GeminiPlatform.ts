import { spawn, type ChildProcess } from 'node:child_process';
import type { IAgentPlatform } from '../types.js';

/**
 * Gemini CLI 平台：通过 @google/gemini-cli，使用 -p 非交互
 * 文档：https://google-gemini.github.io/gemini-cli/
 */
export const GeminiPlatform: IAgentPlatform = {
  name: 'gemini',

  async checkAvailable(): Promise<boolean> {
    try {
      const { execSync } = await import('node:child_process');
      execSync('gemini --version', { stdio: 'ignore' });
      // 检查 GEMINI_API_KEY 是否设置
      if (!process.env.GEMINI_API_KEY) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  async spawn(options) {
    const { prompt, cwd, env } = options;
    const child = spawn(
      'gemini',
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
