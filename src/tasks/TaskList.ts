import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Task, TaskStatus } from '../types.js';
import { taskListPath } from '../utils/storage.js';
import { withTaskLock } from './lock.js';

function loadTasks(teamName: string): Task[] {
  const p = taskListPath(teamName);
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as Task[];
  } catch {
    return [];
  }
}

function saveTasks(teamName: string, tasks: Task[]): void {
  const p = taskListPath(teamName);
  // 确保目录存在（并发安全）
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(tasks, null, 2), 'utf-8');
}

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * 获取团队任务列表（不持锁，仅读）
 */
export function getTasks(teamName: string): Task[] {
  return loadTasks(teamName);
}

/**
 * 添加任务
 */
export async function addTask(
  teamName: string,
  title: string,
  options?: { description?: string; dependencies?: string[] }
): Promise<Task> {
  return withTaskLock(teamName, () => {
    const tasks = loadTasks(teamName);
    const task: Task = {
      id: generateId(),
      title,
      status: 'pending',
      dependencies: options?.dependencies ?? [],
      createdAt: now(),
      updatedAt: now(),
      description: options?.description,
    };
    tasks.push(task);
    saveTasks(teamName, tasks);
    return task;
  });
}

/**
 * 批量添加任务
 */
export async function addTasks(
  teamName: string,
  items: Array<{ title: string; description?: string; dependencies?: string[] }>
): Promise<Task[]> {
  return withTaskLock(teamName, () => {
    const tasks = loadTasks(teamName);
    const newTasks: Task[] = items.map((item) => ({
      id: generateId(),
      title: item.title,
      status: 'pending' as TaskStatus,
      dependencies: item.dependencies ?? [],
      createdAt: now(),
      updatedAt: now(),
      description: item.description,
    }));
    tasks.push(...newTasks);
    saveTasks(teamName, tasks);
    return newTasks;
  });
}

/**
 * 认领任务：将任务设为 in_progress 并设置 assignee。若依赖未完成或已被认领则返回 null
 */
export async function claimTask(
  teamName: string,
  taskId: string,
  assigneeId: string
): Promise<Task | null> {
  return withTaskLock(teamName, () => {
    const tasks = loadTasks(teamName);
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'pending' || task.assignee) return null;
    const depsDone = task.dependencies.every((depId) =>
      tasks.find((t) => t.id === depId && t.status === 'completed')
    );
    if (!depsDone) return null;
    task.status = 'in_progress';
    task.assignee = assigneeId;
    task.updatedAt = now();
    saveTasks(teamName, tasks);
    return task;
  });
}

/**
 * 完成任务
 */
export async function completeTask(teamName: string, taskId: string): Promise<Task | null> {
  return withTaskLock(teamName, () => {
    const tasks = loadTasks(teamName);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.status = 'completed';
    task.updatedAt = now();
    saveTasks(teamName, tasks);
    return task;
  });
}

/**
 * 获取可认领的任务（pending、无 assignee、依赖已满足）
 */
export function getClaimableTasks(teamName: string): Task[] {
  const tasks = loadTasks(teamName);
  return tasks.filter((t) => {
    if (t.status !== 'pending' || t.assignee) return false;
    return t.dependencies.every((depId) =>
      tasks.some((d) => d.id === depId && d.status === 'completed')
    );
  });
}

/**
 * 更新任务状态（负责人用）
 */
export async function updateTaskStatus(
  teamName: string,
  taskId: string,
  status: TaskStatus,
  assignee?: string
): Promise<Task | null> {
  return withTaskLock(teamName, () => {
    const tasks = loadTasks(teamName);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    task.status = status;
    task.updatedAt = now();
    if (assignee !== undefined) task.assignee = assignee;
    saveTasks(teamName, tasks);
    return task;
  });
}
