import { Router } from 'express';
import { handleAssistantChat } from '../controllers/assistantController.js';

const router = Router();

// POST /api/assistant/chat
router.post('/chat', handleAssistantChat);

export default router;

