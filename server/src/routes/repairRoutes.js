import { Router } from 'express';
import { analyzeRepairDecision, estimateRepair, explainVerdict } from '../controllers/repairController.js';

const router = Router();

// POST /api/repair/analyze
router.post('/analyze', analyzeRepairDecision);

// POST /api/repair/estimate
router.post('/estimate', estimateRepair);

// POST /api/repair/explain  (why this verdict, with cited repair guides)
router.post('/explain', explainVerdict);

export default router;
