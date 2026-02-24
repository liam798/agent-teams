/**
 * 任务状态：待处理、进行中、已完成
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * 单条任务
 */
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  /** 依赖的任务 ID 列表，全部完成后才可认领 */
  dependencies: string[];
  /** 认领该任务的队友 ID，未分配则为 undefined */
  assignee?: string;
  /** 创建时间 ISO 字符串 */
  createdAt: string;
  /** 更新时间 ISO 字符串 */
  updatedAt: string;
  /** 可选描述 */
  description?: string;
}

/**
 * 支持的 Agent 平台
 */
export type AgentPlatform = 'codex' | 'claude' | 'gemini';

/**
 * 队友成员定义
 */
export interface TeammateMember {
  id: string;
  name: string;
  platform: AgentPlatform;
  /** 职责描述，用于在 UI 中展示该成员的职责说明 */
  description?: string;
  /** 平台特定选项，如模型名 */
  platformOptions?: Record<string, unknown>;
  /** 生成该队友时的初始提示 */
  spawnPrompt?: string;
}

/**
 * 团队配置（持久化到 config.json）
 */
export interface TeamConfig {
  name: string;
  createdAt: string;
  updatedAt: string;
  members: TeammateMember[];
  /** 负责人/创建者标识 */
  leadId?: string;
}

/**
 * 信箱消息
 */
export interface MailboxMessage {
  id: string;
  from: string;   // 发送者 teammate id
  to: string;     // 接收者 teammate id，或 'lead' 表示负责人
  body: string;
  createdAt: string;
  /** 计划批准等扩展类型 */
  type?: 'message' | 'plan_approval' | 'idle_notification';
}

/**
 * 创建团队选项
 */
export interface CreateTeamOptions {
  name: string;
  members: Array<{
    name: string;
    platform: AgentPlatform;
    spawnPrompt?: string;
    platformOptions?: Record<string, unknown>;
  }>;
}

/**
 * 生成队友选项
 */
export interface SpawnTeammateOptions {
  name: string;
  platform: AgentPlatform;
  spawnPrompt: string;
  platformOptions?: Record<string, unknown>;
  /** 是否需要计划批准后才执行 */
  requirePlanApproval?: boolean;
}

/**
 * 平台适配器：各 Agent 平台需实现此接口
 */
export interface IAgentPlatform {
  readonly name: AgentPlatform;
  /** 检查当前环境是否可用（CLI 是否安装等） */
  checkAvailable(): Promise<boolean>;
  /** 生成一个子进程运行该 Agent，传入初始提示；返回子进程与可用的 stdin 流 */
  spawn(options: {
    prompt: string;
    cwd: string;
    env?: NodeJS.ProcessEnv;
    platformOptions?: Record<string, unknown>;
  }): Promise<{ process: import('child_process').ChildProcess; stdin: NodeJS.WritableStream }>;
  /** 向已运行的进程发送一条消息（若平台支持） */
  sendMessage?(stdin: NodeJS.WritableStream, message: string): void;
}
