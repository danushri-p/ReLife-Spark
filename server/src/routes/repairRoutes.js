import { Router } from 'express';
import { analyzeRepairDecision, estimateRepair } from '../controllers/repairController.js';

const router = Router();

// POST /api/repair/analyze
router.post('/analyze', analyzeRepairDecision);

// POST /api/repair/estimate
router.post('/estimate', estimateRepair);

export default router;
