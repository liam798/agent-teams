import { Router, type Request, type Response } from 'express';
import {
  listTeams,
  loadTeamConfig,
  createTeam,
  deleteTeam,
  listTasks,
} from '../../index.js';
import type { CreateTeamOptions } from '../../types.js';

const router = Router({ mergeParams: true });

// 获取所有团队
router.get('/', (req: Request, res: Response) => {
  try {
    const teamNames = listTeams();
    const teams = teamNames.map((name) => {
      const config = loadTeamConfig(name);
      if (!config) return null;
      
      // 获取任务统计
      const tasks = listTasks(name);
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        completed: tasks.filter(t => t.status === 'completed').length,
      };
      
      return {
        name: config.name,
        description: config.description,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        memberCount: config.members.length,
        taskStats,
        members: config.members,
      };
    }).filter(Boolean);
    
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 创建团队
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, members, description } = req.body as CreateTeamOptions;

    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: '缺少必要参数: name, members' });
    }

    createTeam({ name, members, ...(description ? { description } : {}) });
    const config = loadTeamConfig(name);
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取团队详情
router.get('/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const config = loadTeamConfig(name);
    
    if (!config) {
      return res.status(404).json({ error: '团队不存在' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除团队
router.delete('/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    deleteTeam(name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
