import { Router } from 'express';
import { uploadDamagePhotos } from '../controllers/diagnosisController.js';
import { uploadDamageImages } from '../middleware/upload.js';

const router = Router();

// POST /api/diagnosis/upload
router.post('/upload', uploadDamageImages.array('images', 5), uploadDamagePhotos);

export default router;

