import type { AgentPlatform, IAgentPlatform } from '../types.js';
import { CodexPlatform } from './CodexPlatform.js';
import { ClaudeCodePlatform } from './ClaudeCodePlatform.js';
import { GeminiPlatform } from './GeminiPlatform.js';

const platforms: Record<AgentPlatform, IAgentPlatform> = {
  codex: CodexPlatform,
  claude: ClaudeCodePlatform,
  gemini: GeminiPlatform,
};

export function getPlatform(name: AgentPlatform): IAgentPlatform {
  const p = platforms[name];
  if (!p) throw new Error(`不支持的平台: ${name}`);
  return p;
}

export function getAvailablePlatforms(): Promise<AgentPlatform[]> {
  return Promise.all(
    (Object.keys(platforms) as AgentPlatform[]).map(async (name) => {
      const ok = await platforms[name].checkAvailable();
      return ok ? name : null;
    })
  ).then((arr) => arr.filter((x): x is AgentPlatform => x != null));
}

export { CodexPlatform, ClaudeCodePlatform, GeminiPlatform };
