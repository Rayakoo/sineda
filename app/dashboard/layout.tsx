'use client'

import SiswaGuard from '@/components/SiswaGuard'

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  return <SiswaGuard>{children}</SiswaGuard>
}
