import { Router, type Request, type Response } from 'express';
import { getAvailablePlatforms } from '../../index.js';

const router = Router();

// 获取可用平台
router.get('/', async (req: Request, res: Response) => {
  try {
    const platforms = await getAvailablePlatforms();
    res.json(platforms);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
