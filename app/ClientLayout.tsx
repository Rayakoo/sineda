'use client'

import { usePathname } from 'next/navigation'
import SiteHeader from '@/app/components/SiteHeader'
import SiteFooter from '@/app/components/SiteFooter'
import AccessibilityWidget from '@/components/AccessibilityWidget'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')
  const isQuiz = /^\/course\/[^/]+\/[^/]+$/.test(pathname) && !pathname.endsWith('/materi') && !pathname.endsWith('/hasil')

  if (isAdmin || isQuiz) return <>{children}</>

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <AccessibilityWidget />
    </>
  )
}
