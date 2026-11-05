import { createElement } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Watch,
  Headphones,
  Camera,
  Gamepad2,
  Tv,
  Box,
} from 'lucide-react';

/**
 * Kinds of device ReLife-Spark can assess. `value` is what the server stores
 * (keep in sync with server/src/config/deviceTypes.js); `noun` is used in sentences.
 */
export const DEVICE_TYPES = [
  {
    value: 'Smartphone',
    noun: 'phone',
    plural: 'phones',
    icon: Smartphone,
    modelPlaceholder: 'e.g. Galaxy S24 Ultra 512GB',
    brands: ['Apple', 'Samsung', 'Google Pixel', 'OnePlus', 'Xiaomi', 'Motorola', 'Nothing', 'Sony', 'Oppo / Vivo'],
    symptoms: [
      'Cracked screen',
      'Display lines / bleeding',
      'Battery drains fast',
      'Swollen battery',
      'Water damage',
      'Charging port loose',
      'Face ID / fingerprint not working',
      'Camera lens cracked',
    ],
  },
  {
    value: 'Tablet',
    noun: 'tablet',
    plural: 'tablets',
    icon: Tablet,
    modelPlaceholder: 'e.g. iPad Air (M2) 11-inch',
    brands: ['Apple', 'Samsung', 'Lenovo', 'Xiaomi', 'OnePlus', 'Amazon'],
    symptoms: [
      'Cracked screen',
      'Touch not responding',
      'Battery drains fast',
      'Swollen battery',
      'Charging port loose',
      'Bent frame',
      'Stuck on logo / boot loop',
      'Speaker not working',
    ],
  },
  {
    value: 'Laptop',
    noun: 'laptop',
    plural: 'laptops',
    icon: Laptop,
    modelPlaceholder: 'e.g. MacBook Air M2 13-inch',
    brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Microsoft Surface', 'Samsung'],
    symptoms: [
      'Cracked or dead screen',
      'Keyboard keys not working',
      'Battery not holding charge',
      'Swollen battery',
      'Overheating / loud fan',
      'Liquid spill',
      'Hinge broken',
      'Won’t power on',
    ],
  },
  {
    value: 'Desktop PC',
    noun: 'computer',
    plural: 'computers',
    icon: Monitor,
    modelPlaceholder: 'e.g. iMac 24-inch M3, or custom build',
    brands: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'Custom build'],
    symptoms: [
      'Won’t power on',
      'Random shutdowns / restarts',
      'Overheating / loud fan',
      'No display output',
      'Hard drive / SSD failing',
      'Blue screen errors',
      'Power supply failed',
      'USB ports not working',
    ],
  },
  {
    value: 'Smartwatch',
    noun: 'smartwatch',
    plural: 'smartwatches',
    icon: Watch,
    modelPlaceholder: 'e.g. Apple Watch Series 9 45mm',
    brands: ['Apple', 'Samsung', 'Garmin', 'Fitbit', 'Amazfit', 'Noise', 'boAt'],
    symptoms: [
      'Cracked screen',
      'Battery drains fast',
      'Won’t charge',
      'Water damage',
      'Heart-rate sensor not working',
      'Buttons / crown stuck',
      'Strap mount broken',
    ],
  },
  {
    value: 'Headphones / Earbuds',
    noun: 'headphones',
    plural: 'headphones',
    icon: Headphones,
    modelPlaceholder: 'e.g. Sony WH-1000XM5',
    brands: ['Apple', 'Sony', 'Bose', 'Samsung', 'JBL', 'Sennheiser', 'boAt', 'OnePlus'],
    symptoms: [
      'One side not working',
      'Battery drains fast',
      'Case won’t charge',
      'Crackling / distorted sound',
      'Bluetooth keeps disconnecting',
      'Microphone not working',
      'Headband / hinge broken',
      'Ear cushions worn',
    ],
  },
  {
    value: 'Camera',
    noun: 'camera',
    plural: 'cameras',
    icon: Camera,
    modelPlaceholder: 'e.g. Canon EOS R6 Mark II',
    brands: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Panasonic', 'GoPro', 'DJI'],
    symptoms: [
      'Lens won’t focus',
      'Shutter error',
      'Cracked LCD screen',
      'Won’t power on',
      'Sensor dust / spots on photos',
      'Water / sand damage',
      'Memory card slot faulty',
    ],
  },
  {
    value: 'Gaming Console',
    noun: 'console',
    plural: 'consoles',
    icon: Gamepad2,
    modelPlaceholder: 'e.g. PlayStation 5 Slim',
    brands: ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo', 'Valve Steam Deck', 'Asus ROG Ally'],
    symptoms: [
      'Won’t power on',
      'Overheating / loud fan',
      'Disc drive not reading',
      'HDMI port damaged',
      'Controller drift',
      'Freezes / crashes',
      'No display output',
    ],
  },
  {
    value: 'TV / Monitor',
    noun: 'screen',
    plural: 'screens',
    icon: Tv,
    modelPlaceholder: 'e.g. LG C3 55-inch OLED',
    brands: ['Samsung', 'LG', 'Sony', 'Xiaomi', 'TCL', 'OnePlus', 'Dell', 'BenQ'],
    symptoms: [
      'Cracked panel',
      'No picture, sound works',
      'Lines on screen',
      'Backlight dark / dim',
      'Won’t power on',
      'HDMI ports not working',
      'Remote / buttons not responding',
    ],
  },
  {
    value: 'Other',
    noun: 'device',
    plural: 'devices',
    icon: Box,
    modelPlaceholder: 'e.g. Kindle Paperwhite, Bluetooth speaker',
    brands: [],
    symptoms: ['Won’t power on', 'Battery drains fast', 'Won’t charge', 'Physical damage', 'Water damage', 'Buttons not working'],
  },
];

/** Records saved before device types existed are phones. */
export const DEFAULT_DEVICE_TYPE = 'Smartphone';

export const getDeviceType = (value) =>
  DEVICE_TYPES.find((t) => t.value === value) || DEVICE_TYPES.find((t) => t.value === DEFAULT_DEVICE_TYPE);

/** "phone", "laptop", … for a case or a device-type value. */
export const deviceNoun = (caseOrType) =>
  getDeviceType(typeof caseOrType === 'string' ? caseOrType : caseOrType?.deviceType).noun;

/** Icon component for a case or a device-type value. */
export const deviceIcon = (caseOrType) =>
  getDeviceType(typeof caseOrType === 'string' ? caseOrType : caseOrType?.deviceType).icon;

/** <DeviceIcon type={a.deviceType} className="h-5 w-5" /> */
export const DeviceIcon = ({ type, ...props }) => createElement(getDeviceType(type).icon, props);
