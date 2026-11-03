import { body, validationResult } from 'express-validator';

export const validateDeviceInput = [
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Smartphone brand is required')
    .isLength({ max: 50 })
    .withMessage('Brand cannot exceed 50 characters'),

  body('model')
    .trim()
    .notEmpty()
    .withMessage('Smartphone model is required')
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
    .isIn(['Under Warranty', 'Expired', 'Third-Party Warranty', 'Unknown'])
    .withMessage('Invalid warranty status selected'),

  body('problemDescription')
    .trim()
    .notEmpty()
    .withMessage('Problem description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Problem description must be between 10 and 2000 characters'),

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

