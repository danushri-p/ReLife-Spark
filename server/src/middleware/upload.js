import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    const fieldPrefix = file.fieldname || 'upload';
    cb(null, `${fieldPrefix}-${uniqueSuffix}${sanitizedExt}`);
  },
});

// File filter for device damage images
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and HEIC images are allowed for damage photos.'), false);
  }
};

// File filter for repair quotations (PDFs and Images)
const quoteFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF documents and image files (JPEG, PNG, WEBP) are allowed for repair quotations.'), false);
  }
};

// Multer instances
export const uploadDamageImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per image
    files: 5, // Maximum 5 images
  },
});

export const uploadQuotationFile = multer({
  storage,
  fileFilter: quoteFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB per quote file
    files: 3, // Maximum 3 quote files
  },
});

export default {
  uploadDamageImages,
  uploadQuotationFile,
};

