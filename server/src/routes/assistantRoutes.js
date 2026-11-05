import { Router } from 'express';
import { handleAssistantChat, listConversations, getConversation, deleteConversation } from '../controllers/assistantController.js';
import { getKnowledgeCatalog } from '../services/knowledgeBaseService.js';
import { uploadDamageImages } from '../middleware/upload.js';

const router = Router();

// GET /api/assistant/knowledge
router.get('/knowledge', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Knowledge catalog retrieved.',
        items: getKnowledgeCatalog(),
    });
});

// POST /api/assistant/chat  (JSON, or multipart with up to 3 `photos`)
router.post('/chat', uploadDamageImages.array('photos', 3), handleAssistantChat);

// Saved chats
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);

export default router;

