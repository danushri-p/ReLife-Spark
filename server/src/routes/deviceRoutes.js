import { Router } from 'express';
import { createDevice, getDeviceById } from '../controllers/deviceController.js';
import { validateDeviceInput } from '../validators/deviceValidator.js';

const router = Router();

// POST /api/devices
router.post('/', validateDeviceInput, createDevice);

// GET /api/devices/:id
router.get('/:id', getDeviceById);

export default router;

