import { body, validationResult } from 'express-validator';
import { DEVICE_TYPE_VALUES } from '../config/deviceTypes.js';

export const validateDeviceInput = [
  body('deviceType')
    .optional({ values: 'falsy' })
    .trim()
    .isIn(DEVICE_TYPE_VALUES)
    .withMessage('Unsupported device type'),

  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Device brand is required')
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters'),

  body('model')
    .trim()
    .notEmpty()
    .withMessage('Device model is required')
    .isLength({ max: 100 })
    .withMessage('Model cannot exceed 100 characters'),

  body('deviceAge')
    .trim()
    .notEmpty()
    .withMessage('Device age is required'),

  body('condition')
    .trim()
    .notEmpty()
    .withMessage('Device condition is required')
    .isIn(['Pristine', 'Good', 'Fair', 'Heavily Used', 'Cracked / Damaged'])
    .withMessage('Invalid condition selected'),

  body('warrantyStatus')
    .trim()
    .notEmpty()
    .withMessage('Warranty status is required')
    .isIn(['AppleCare+ / Care Plan', 'Under Warranty', 'Third-Party Warranty', 'Expired', 'Unknown'])
    .withMessage('Invalid warranty status selected'),

  body('problemDescription')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Problem description cannot exceed 2000 characters'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];

