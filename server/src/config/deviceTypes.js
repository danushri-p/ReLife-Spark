/**
 * Kinds of device ReLife-Spark can assess. Keep in sync with client/src/data/deviceTypes.js.
 * `noun` is the short word used in sentences ("repairing your laptop").
 */
export const DEVICE_TYPES = [
  { value: 'Smartphone', noun: 'phone' },
  { value: 'Tablet', noun: 'tablet' },
  { value: 'Laptop', noun: 'laptop' },
  { value: 'Desktop PC', noun: 'computer' },
  { value: 'Smartwatch', noun: 'smartwatch' },
  { value: 'Headphones / Earbuds', noun: 'headphones' },
  { value: 'Camera', noun: 'camera' },
  { value: 'Gaming Console', noun: 'console' },
  { value: 'TV / Monitor', noun: 'screen' },
  { value: 'Other', noun: 'device' },
];

export const DEVICE_TYPE_VALUES = DEVICE_TYPES.map((t) => t.value);

/** Records saved before device types existed are phones. */
export const DEFAULT_DEVICE_TYPE = 'Smartphone';

export const normalizeDeviceType = (value) => (DEVICE_TYPE_VALUES.includes(value) ? value : DEFAULT_DEVICE_TYPE);

/** "phone", "laptop", … for use in sentences. Unknown types read as "device". */
export const deviceNoun = (value) => DEVICE_TYPES.find((t) => t.value === value)?.noun || 'device';
