import Device from '../models/Device.js';
import mongoose from 'mongoose';
import { normalizeDeviceType } from '../config/deviceTypes.js';

/**
 * Submit device information
 * POST /api/devices
 */
export const createDevice = async (req, res, next) => {
  try {
    const { deviceType, brand, model, deviceAge, condition, warrantyStatus, problemDescription } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify your MONGODB_URI configuration in server/.env.',
        savedLocally: false,
      });
    }

    const newDevice = await Device.create({
      deviceType: normalizeDeviceType(deviceType),
      brand,
      model,
      deviceAge,
      condition,
      warrantyStatus,
      problemDescription,
    });

    res.status(201).json({
      success: true,
      message: 'Device information recorded successfully.',
      device: newDevice,
      _id: newDevice._id,
      data: newDevice,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve device information by ID
 * GET /api/devices/:id
 */
export const getDeviceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid device ID format.',
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify your MONGODB_URI.',
      });
    }

    const device = await Device.findById(id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Device with ID ${id} not found.`,
      });
    }

    res.status(200).json({
      success: true,
      device,
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

