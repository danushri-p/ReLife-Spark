import Device from '../models/Device.js';
import mongoose from 'mongoose';

/**
 * Submit device information
 * POST /api/devices
 */
export const createDevice = async (req, res, next) => {
  try {
    const { brand, model, deviceAge, condition, warrantyStatus, problemDescription } = req.body;

    // Check if database is currently connected
    if (mongoose.connection.readyState !== 1) {
      // Return a clean structured response explaining DB status
      return res.status(503).json({
        success: false,
        message: 'Database is not connected. Please verify your MONGODB_URI configuration in server/.env.',
        savedLocally: false,
      });
    }

    const newDevice = await Device.create({
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
      data: device,
    });
  } catch (error) {
    next(error);
  }
};

