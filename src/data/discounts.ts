import { Discount } from '../types';

export const mockDiscounts: Discount[] = [
  { code: 'TRIP10', type: 'percentage', value: 10 },
  { code: 'SAVE500', type: 'fixed', value: 500 },
  { code: 'STUDENT15', type: 'percentage', value: 15 },
  { code: 'WELCOME', type: 'fixed', value: 300 }
];
