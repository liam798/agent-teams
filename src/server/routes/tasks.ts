import { Router, type Request, type Response } from 'express';
import {
  listTasks,
  addTask,
  addTasks,
} from '../../index.js';
import { getTasks, updateTaskStatus, claimTask, completeTask } from '../../tasks/TaskList.js';

const router = Router({ mergeParams: true });

// 获取任务列表
router.get('/', (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const tasks = listTasks(teamName);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 创建任务
router.post('/', async (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const { title, description, dependencies } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: '缺少必要参数: title' });
    }
    
    const task = await addTask(teamName, title, {
      description,
      dependencies: dependencies || [],
    });
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 批量创建任务
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'tasks 必须是数组' });
    }
    
    const createdTasks = await addTasks(teamName, tasks);
    res.status(201).json(createdTasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 更新任务
router.put('/:taskId', async (req: Request, res: Response) => {
  try {
    const { teamName, taskId } = req.params;
    const { title, description, status, dependencies, assignee } = req.body;
    
    const tasks = getTasks(teamName);
    const task = tasks.find((t) => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    // 更新任务字段（需要重新加载以获取最新状态）
    if (title !== undefined || description !== undefined || dependencies !== undefined) {
      // 这里需要实现一个更新任务字段的函数，暂时先更新状态
      if (status) {
        await updateTaskStatus(teamName, taskId, status, assignee);
      }
      // 重新加载任务
      const updatedTasks = getTasks(teamName);
      const updatedTask = updatedTasks.find((t) => t.id === taskId);
      return res.json(updatedTask || task);
    }
    
    if (status) {
      await updateTaskStatus(teamName, taskId, status, assignee || undefined);
      const updatedTasks = getTasks(teamName);
      const updatedTask = updatedTasks.find((t) => t.id === taskId);
      return res.json(updatedTask || task);
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 认领任务
router.post('/:taskId/claim', async (req: Request, res: Response) => {
  try {
    const { teamName, taskId } = req.params;
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: '缺少必要参数: memberId' });
    }
    
    const task = await claimTask(teamName, taskId, memberId);
    
    if (!task) {
      return res.status(400).json({ error: '无法认领任务（可能依赖未完成或已被认领）' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 完成任务
router.post('/:taskId/complete', async (req: Request, res: Response) => {
  try {
    const { teamName, taskId } = req.params;
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: '缺少必要参数: memberId' });
    }
    
    const task = await completeTask(teamName, taskId);
    
    if (!task) {
      return res.status(400).json({ error: '无法完成任务（可能未被认领）' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
