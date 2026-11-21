/** الألوان المعتمدة (مطابقة لمتغيرات CSS في app/globals.css). */
export const palette = {
  bg: '#1A120E', // الخلفية الأساسية
  surface: '#3A2418', // الكروت والحاويات
  primary: '#6B4A2E', // العناصر النشطة والأزرار الرئيسية
  accent: '#A88462', // العناصر المميزة والروابط
  text: '#D5C4AE', // النصوص الأساسية
  line: '#4A4A46', // الحدود والتفاصيل الثانوية
} as const;

export const motion = {
  fast: '150ms',
  base: '200ms',
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;
