import * as fs from 'node:fs';
import * as path from 'node:path';
import { taskLockPath } from '../utils/storage.js';

const LOCK_RETRY_MS = 50;
const LOCK_TIMEOUT_MS = 5000;

/**
 * 简单文件锁：用于任务认领等竞态保护
 */
export async function withTaskLock<T>(
  teamName: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const lockFile = taskLockPath(teamName);
  const start = Date.now();
  let fd: number | null = null;

  while (Date.now() - start < LOCK_TIMEOUT_MS) {
    try {
      fd = fs.openSync(lockFile, 'wx');
      break;
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === 'EEXIST') {
        await new Promise((r) => setTimeout(r, LOCK_RETRY_MS));
        continue;
      }
      throw e;
    }
  }

  if (fd == null) {
    throw new Error(`获取任务锁超时: ${teamName}`);
  }

  try {
    return await fn();
  } finally {
    fs.closeSync(fd);
    try {
      fs.unlinkSync(lockFile);
    } catch {
      // 忽略删除失败
    }
  }
}
