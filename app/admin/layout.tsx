'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: 'fa-chart-pie' },
  { label: 'Kelola Course', href: '/admin/courses', icon: 'fa-book' },
  { label: 'Laporan Siswa', href: '/admin/reports', icon: 'fa-chart-bar' },
  { label: 'Kelola Users', href: '/admin/users', icon: 'fa-users-cog' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  if (pathname === '/admin/login') return <>{children}</>

  const displayName = user?.email?.split('@')[0] || 'Admin'

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <aside className="w-64 bg-[#00335c] flex flex-col justify-between shrink-0">
          <div>
            <Link href="/" className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
              <img src="/logo_sineda.png" alt="SINEDA" className="h-8" />
              <span className="text-[9px] text-blue-300 uppercase tracking-wider">Admin Panel</span>
            </Link>

            <nav className="p-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
                      isActive ? 'bg-[#005696] text-white font-semibold shadow-md' : 'text-blue-200 hover:bg-white/10'
                    }`}
                  >
                    <i className={`fas ${item.icon} w-5 text-center`}></i>
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-400 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white">
                {displayName[0]}
              </div>
              <div className="text-sm truncate flex-1">
                <p className="font-medium text-white truncate">{displayName}</p>
                <p className="text-[10px] text-blue-300">Admin</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-sign-out-alt"></i> Keluar
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 md:p-10">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
