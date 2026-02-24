import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// 在 ESM 中获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取 agent-teams 包的根目录（包含 skills 目录）
 */
export function getPackageRoot(): string {
  // 方法1: 从环境变量获取（如果用户设置了）
  if (process.env.AGENT_TEAMS_ROOT) {
    const root = process.env.AGENT_TEAMS_ROOT;
    if (fs.existsSync(path.join(root, 'package.json'))) {
      return root;
    }
  }

  // 方法2: 从当前文件位置向上查找（开发环境或全局安装）
  let current = __dirname;
  let checked = 0;
  while (current !== path.dirname(current) && checked < 10) {
    const packageJson = path.join(current, 'package.json');
    if (fs.existsSync(packageJson)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
        if (pkg.name === 'agent-teams') {
          return current;
        }
      } catch {
        // 忽略解析错误
      }
    }
    current = path.dirname(current);
    checked++;
  }

  // 方法3: 从 node_modules 查找（作为依赖安装）
  if (__dirname.includes('node_modules')) {
    const parts = __dirname.split(path.sep);
    const nodeModulesIndex = parts.lastIndexOf('node_modules');
    if (nodeModulesIndex >= 0) {
      const candidate = path.join(...parts.slice(0, nodeModulesIndex + 2));
      const packageJson = path.join(candidate, 'package.json');
      if (fs.existsSync(packageJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
          if (pkg.name === 'agent-teams') {
            return candidate;
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  // 方法4: 从当前工作目录查找（CLI 运行时）
  const cwd = process.cwd();
  const cwdPackageJson = path.join(cwd, 'package.json');
  if (fs.existsSync(cwdPackageJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(cwdPackageJson, 'utf-8'));
      if (pkg.name === 'agent-teams') {
        return cwd;
      }
    } catch {
      // 忽略解析错误
    }
  }

  // 方法5: 尝试常见全局安装位置
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (homeDir) {
    const commonPaths = [
      path.join(homeDir, '.npm-global', 'lib', 'node_modules', 'agent-teams'),
      path.join(homeDir, '.nvm', 'versions', 'node', '*', 'lib', 'node_modules', 'agent-teams'),
      path.join('/usr', 'local', 'lib', 'node_modules', 'agent-teams'),
      path.join('/usr', 'lib', 'node_modules', 'agent-teams'),
    ];
    for (const candidate of commonPaths) {
      if (fs.existsSync(path.join(candidate, 'package.json'))) {
        return candidate;
      }
    }
  }

  throw new Error(
    '无法找到 agent-teams 包根目录。请设置环境变量 AGENT_TEAMS_ROOT 指向包目录，或确保已正确安装 agent-teams'
  );
}

/**
 * 获取技能目录路径
 */
export function getSkillsDir(): string {
  const root = getPackageRoot();
  return path.join(root, 'skills');
}

/**
 * 获取 agent-teams 技能目录（通用，适用于所有平台）
 */
export function getAgentTeamsSkillDir(): string {
  return path.join(getSkillsDir(), 'agent-teams');
}

/**
 * 检查技能是否存在
 */
export function skillExists(platform: 'codex' | 'claude' | 'gemini'): boolean {
  const skillDir = getAgentTeamsSkillDir();
  if (!fs.existsSync(skillDir)) return false;
  
  // 检查是否有对应平台的配置文件
  const platformConfig = path.join(skillDir, 'agents', `${platform}.yaml`);
  return fs.existsSync(platformConfig) || fs.existsSync(path.join(skillDir, 'SKILL.md'));
}

/**
 * 列出所有可用的技能平台（基于 agents/ 目录中的配置文件）
 */
export function listAvailableSkills(): string[] {
  const skillDir = getAgentTeamsSkillDir();
  if (!fs.existsSync(skillDir)) return [];
  
  const agentsDir = path.join(skillDir, 'agents');
  if (!fs.existsSync(agentsDir)) return [];
  
  return fs.readdirSync(agentsDir)
    .filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))
    .map((file) => path.basename(file, path.extname(file)))
    .filter((name) => ['codex', 'claude', 'gemini'].includes(name));
}

/**
 * 安装技能到 Codex
 */
export async function installSkillToCodex(): Promise<void> {
  const skillDir = getAgentTeamsSkillDir();
  if (!fs.existsSync(skillDir)) {
    throw new Error('agent-teams 技能目录不存在');
  }

  const codexHome = process.env.CODEX_HOME || path.join(process.env.HOME || process.env.USERPROFILE || '', '.codex');
  const targetDir = path.join(codexHome, 'skills', 'agent-teams');

  // 确保目标目录存在
  if (!fs.existsSync(path.dirname(targetDir))) {
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  }

  // 如果目标已存在，先删除
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }

  // 复制技能目录
  fs.cpSync(skillDir, targetDir, { recursive: true });

  // Codex 期望 agents/openai.yaml，如果有 codex.yaml 则复制或创建符号链接
  const codexYaml = path.join(targetDir, 'agents', 'codex.yaml');
  const openaiYaml = path.join(targetDir, 'agents', 'openai.yaml');
  if (fs.existsSync(codexYaml) && !fs.existsSync(openaiYaml)) {
    fs.copyFileSync(codexYaml, openaiYaml);
  }

  console.log(`技能已安装到: ${targetDir}`);
  console.log('请重启 Codex 以加载新技能');
}

/**
 * 获取技能安装路径（用于显示）
 */
export function getSkillInstallPath(platform: 'codex' | 'claude' | 'gemini'): string {
  const home = process.env.HOME || process.env.USERPROFILE || '~';
  switch (platform) {
    case 'codex':
      const codexHome = process.env.CODEX_HOME || path.join(home, '.codex');
      return path.join(codexHome, 'skills', 'agent-teams');
    case 'claude':
      // Claude Code 可能使用不同的路径
      return path.join(home, '.claude', 'skills', 'agent-teams') + ' (如果支持)';
    case 'gemini':
      // Gemini CLI 可能使用不同的路径
      return path.join(home, '.gemini', 'skills', 'agent-teams') + ' (如果支持)';
    default:
      return '未知平台';
  }
}
