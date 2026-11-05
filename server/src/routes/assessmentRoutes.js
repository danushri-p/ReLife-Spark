import { Router } from 'express';
import {
    createAssessment,
    deleteAssessment,
    getAssessmentById,
    getAssessments,
    getAssessmentStats,
    updateAssessment,
} from '../controllers/assessmentController.js';

const router = Router();

// POST /api/assessments
router.post('/', createAssessment);

// GET /api/assessments?userId=&status=&limit=
router.get('/', getAssessments);

// GET /api/assessments/stats?userId=   (must come before /:id)
router.get('/stats', getAssessmentStats);

// GET /api/assessments/:id
router.get('/:id', getAssessmentById);

// PATCH /api/assessments/:id
router.patch('/:id', updateAssessment);

// DELETE /api/assessments/:id
router.delete('/:id', deleteAssessment);

export default router;
