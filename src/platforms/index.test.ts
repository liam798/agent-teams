import { describe, it, expect, vi } from 'vitest';
import { getPlatform, getAvailablePlatforms } from './index.js';
import { CodexPlatform } from './CodexPlatform.js';
import { ClaudeCodePlatform } from './ClaudeCodePlatform.js';
import { GeminiPlatform } from './GeminiPlatform.js';

describe('platforms', () => {
  it('应该获取正确的平台实例', () => {
    expect(getPlatform('codex')).toBe(CodexPlatform);
    expect(getPlatform('claude')).toBe(ClaudeCodePlatform);
    expect(getPlatform('gemini')).toBe(GeminiPlatform);
  });

  it('应该在无效平台时抛出错误', () => {
    expect(() => getPlatform('invalid' as any)).toThrow();
  });

  it('应该检查平台可用性', async () => {
    // Mock checkAvailable 方法
    const originalCheck = CodexPlatform.checkAvailable;
    CodexPlatform.checkAvailable = vi.fn().mockResolvedValue(true);

    const platforms = await getAvailablePlatforms();
    expect(platforms).toContain('codex');

    // 恢复原始方法
    CodexPlatform.checkAvailable = originalCheck;
  });
});
