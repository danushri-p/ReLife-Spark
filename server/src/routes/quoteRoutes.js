import { Router } from 'express';
import { uploadQuoteDocument } from '../controllers/quoteController.js';
import { uploadQuotationFile } from '../middleware/upload.js';

const router = Router();

// POST /api/quotes/upload
router.post('/upload', uploadQuotationFile.array('quotes', 3), uploadQuoteDocument);

export default router;

