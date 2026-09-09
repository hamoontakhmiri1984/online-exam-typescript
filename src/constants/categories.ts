export const CATEGORIES = [
  'ریاضی',
  'فیزیک',
  'شیمی',
  'فرانت‌اند',
  'دیتابیس',
] as const;

export type Category = (typeof CATEGORIES)[number];
