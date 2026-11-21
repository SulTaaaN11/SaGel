import type { ReactNode } from 'react';
import { requireAdminPage } from '@/lib/admin-guard';

// حارس فقط (بدون واجهة): أي مسار تحت /admin يتطلب جلسة إدارة صالحة.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <>{children}</>;
}
