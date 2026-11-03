import { Router } from 'express';
import { analyzeRepairDecision } from '../controllers/repairController.js';

const router = Router();

// POST /api/repair/analyze
router.post('/analyze', analyzeRepairDecision);

export default router;

