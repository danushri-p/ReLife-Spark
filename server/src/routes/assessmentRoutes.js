import { Router } from 'express';
import { createAssessment, getAssessmentById, getAssessments } from '../controllers/assessmentController.js';

const router = Router();

// POST /api/assessments
router.post('/', createAssessment);

// GET /api/assessments
router.get('/', getAssessments);

// GET /api/assessments/:id
router.get('/:id', getAssessmentById);

export default router;
