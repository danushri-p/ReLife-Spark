import { Router } from 'express';
import { handleAssistantChat } from '../controllers/assistantController.js';
import { getKnowledgeCatalog } from '../services/knowledgeBaseService.js';

const router = Router();

// GET /api/assistant/knowledge
router.get('/knowledge', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Knowledge catalog retrieved.',
        items: getKnowledgeCatalog(),
    });
});

// POST /api/assistant/chat
router.post('/chat', handleAssistantChat);

export default router;

