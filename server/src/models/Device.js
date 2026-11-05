import mongoose from 'mongoose';
import { DEVICE_TYPE_VALUES, DEFAULT_DEVICE_TYPE } from '../config/deviceTypes.js';

const deviceSchema = new mongoose.Schema(
  {
    deviceType: {
      type: String,
      enum: {
        values: DEVICE_TYPE_VALUES,
        message: '{VALUE} is not a supported device type',
      },
      default: DEFAULT_DEVICE_TYPE,
    },
    brand: {
      type: String,
      required: [true, 'Device brand is required'],
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters'],
    },
    model: {
      type: String,
      required: [true, 'Device model is required'],
      trim: true,
      maxlength: [100, 'Model name cannot exceed 100 characters'],
    },
    deviceAge: {
      type: String,
      required: [true, 'Device age is required'],
      trim: true,
    },
    condition: {
      type: String,
      required: [true, 'Device condition is required'],
      enum: {
        values: ['Pristine', 'Good', 'Fair', 'Heavily Used', 'Cracked / Damaged'],
        message: '{VALUE} is not a valid condition',
      },
      default: 'Fair',
    },
    warrantyStatus: {
      type: String,
      required: [true, 'Warranty status is required'],
      enum: {
        values: [
          'AppleCare+ / Care Plan',
          'Under Warranty',
          'Third-Party Warranty',
          'Expired',
          'Unknown',
        ],
        message: '{VALUE} is not a valid warranty status',
      },
      default: 'Unknown',
    },
    problemDescription: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Problem description cannot exceed 2000 characters'],
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Device = mongoose.model('Device', deviceSchema);
export default Device;

