import { Router, type Request, type Response } from 'express';
import {
  loadTeamConfig,
  spawnExistingTeammate,
  getRunningTeammates,
  shutdownTeammate,
} from '../../index.js';

const router = Router({ mergeParams: true });

// 获取成员列表
router.get('/', (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const config = loadTeamConfig(teamName);
    
    if (!config) {
      return res.status(404).json({ error: '团队不存在' });
    }
    
    const running = getRunningTeammates();
    const runningMemberIds = new Set(running.filter(t => t.teamName === teamName).map(t => t.memberId));
    const members = config.members.map((member) => ({
      ...member,
      isRunning: runningMemberIds.has(member.id),
    }));
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 启动队友
router.post('/:memberId/spawn', async (req: Request, res: Response) => {
  try {
    const { teamName, memberId } = req.params;
    const { cwd } = req.body || {};
    
    await spawnExistingTeammate(teamName, memberId, cwd || process.cwd());
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 停止队友
router.post('/:memberId/shutdown', (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    shutdownTeammate(memberId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 获取队友状态
router.get('/:memberId/status', (req: Request, res: Response) => {
  try {
    const { teamName, memberId } = req.params;
    const running = getRunningTeammates();
    const isRunning = running.some(t => t.teamName === teamName && t.memberId === memberId);
    
    res.json({
      memberId,
      isRunning,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
