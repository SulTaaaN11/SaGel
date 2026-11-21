import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import AdminGate from '@/components/AdminGate';
import ToastProvider from '@/components/ToastProvider';
import { tajawal } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'جداول الفرقة الأولى - نظم المعلومات الإدارية',
  description: 'تسكين مواعيد المحاضرات والسكاشن لطلاب الفرقة الأولى بدون تعارض.',
};

export const viewport: Viewport = {
  themeColor: '#0a1016',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>
        <ToastProvider>
          {children}
          <AdminGate />
        </ToastProvider>
      </body>
    </html>
  );
}
