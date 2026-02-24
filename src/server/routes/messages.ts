import { Router, type Request, type Response } from 'express';
import {
  getAllMessages,
  getMessagesFor,
  sendMessage,
} from '../../index.js';
import type { MailboxMessage } from '../../types.js';

const router = Router({ mergeParams: true });

// 获取所有消息
router.get('/', (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const { memberId } = req.query;
    
    const messages = memberId
      ? getMessagesFor(teamName, memberId as string)
      : getAllMessages(teamName);
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 发送消息
router.post('/', (req: Request, res: Response) => {
  try {
    const { teamName } = req.params;
    const { from, to, body, type } = req.body;
    
    if (!from || !to || !body) {
      return res.status(400).json({ error: '缺少必要参数: from, to, body' });
    }
    
    sendMessage(teamName, from, to, body, type || 'message');
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
