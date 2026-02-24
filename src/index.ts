/**
 * Agent-Teams：协调多平台 AI Agent（Codex、Claude Code、Gemini）协作
 * 参考：https://code.claude.com/docs/zh-CN/agent-teams
 */

export type {
  TaskStatus,
  Task,
  AgentPlatform,
  TeammateMember,
  TeamConfig,
  MailboxMessage,
  CreateTeamOptions,
  SpawnTeammateOptions,
  IAgentPlatform,
} from './types.js';

export {
  createTeam,
  addTask,
  addTasks,
  listTasks,
  listClaimableTasks,
  spawnTeammate,
  spawnExistingTeammate,
  sendToTeammate,
  shutdownTeammate,
  getRunningTeammates,
  teammateClaimTask,
  teammateCompleteTask,
  assignTask,
  loadTeamConfig,
  listTeams,
  deleteTeam,
} from './team/TeamLead.js';

export type { SpawnedTeammate } from './team/TeamLead.js';

export {
  sendMessage,
  getMessagesFor,
  getAllMessages,
  deleteMessage,
} from './mailbox/Mailbox.js';

export { getPlatform, getAvailablePlatforms } from './platforms/index.js';
export { setStorageRoot, getStorageRoot } from './utils/storage.js';
export {
  getPackageRoot,
  getSkillsDir,
  getAgentTeamsSkillDir,
  skillExists,
  listAvailableSkills,
  installSkillToCodex,
  getSkillInstallPath,
} from './utils/skills.js';

// 任务列表底层 API（供队友或脚本使用）
export {
  getTasks,
  claimTask,
  completeTask,
  getClaimableTasks,
  updateTaskStatus,
  addTask as addTaskRaw,
  addTasks as addTasksRaw,
} from './tasks/TaskList.js';
