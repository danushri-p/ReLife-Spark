import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: [true, 'Smartphone brand is required'],
      trim: true,
      maxlength: [50, 'Brand name cannot exceed 50 characters'],
    },
    model: {
      type: String,
      required: [true, 'Smartphone model is required'],
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
      required: [true, 'Problem description is required'],
      trim: true,
      minlength: [10, 'Problem description must be at least 10 characters'],
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

