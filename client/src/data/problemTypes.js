import { Cpu, CircleHelp, Wrench } from 'lucide-react';

/**
 * What kind of problem the device has. It decides how we diagnose it:
 * hardware is checked from photos, software from what the user describes, "not sure" uses both.
 * `value` is what the server stores (see server/src/models/Assessment.js).
 */
export const PROBLEM_TYPES = [
  {
    value: 'hardware',
    label: 'Hardware',
    hint: 'Cracks, dents, water damage, broken buttons or ports',
    icon: Wrench,
  },
  {
    value: 'software',
    label: 'Software / not visible',
    hint: 'Crashes, slow, won’t charge, battery, sound, Wi-Fi',
    icon: Cpu,
  },
  {
    value: 'unsure',
    label: 'Not sure',
    hint: 'We’ll use both a photo and your description',
    icon: CircleHelp,
  },
];

export const DEFAULT_PROBLEM_TYPE = 'unsure';

export const normalizeProblemType = (value) =>
  PROBLEM_TYPES.some((t) => t.value === value) ? value : DEFAULT_PROBLEM_TYPE;

/** Faults a photo can't show. Same for every kind of device. */
export const SOFTWARE_SYMPTOMS = [
  'Won’t charge',
  'Charges very slowly',
  'Battery drains fast',
  'Won’t turn on',
  'Keeps restarting or freezing',
  'Very slow / hangs',
  'Overheating',
  'No sound / mic not working',
  'Wi-Fi or Bluetooth not working',
  'Software update failed',
];

/** Hardware problems are photographed; software ones only need a description. */
export const wantsPhoto = (problemType) => problemType !== 'software';
