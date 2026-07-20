'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useNav } from '@/contexts/NavContext'
import LogoutModal from './LogoutModal'

export default function SiteHeader() {
  const [showLogout, setShowLogout] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const { user, logout } = useAuth()
  const { activeSection, setActiveSection } = useNav()

  const userMenuPaths = ['/dashboard', '/admin']
  const isUserMenuActive = userMenuPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  const navRoutes: Record<string, string> = { '/': 'home', '/guru': 'guru', '/siswa': 'siswa', '/orangtua': 'orangtua' }

  const navItemClass = (path: string) => {
    if (isHome) {
      const isActive = activeSection === navRoutes[path]
      return `py-2 transition-colors ${isActive ? 'text-[#F7941E] border-b-2 border-[#F7941E]' : 'nav-link'}`
    }
    const isRouteActive = pathname === path || (path !== '/' && pathname.startsWith(path))
    return `py-2 transition-colors ${isRouteActive ? 'text-[#F7941E] border-b-2 border-[#F7941E]' : 'nav-link'}`
  }

  const handleLogout = () => {
    setShowLogout(false)
    logout()
  }

  const userName = user?.name || user?.email?.split('@')[0] || ''

  return (
    <>
      <div className="bg-white py-2 border-b">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <img
              src="/logo_um.jpeg"
              alt="Diktisaintek"
              className="h-8"
            />
            <span className="text-gray-400">|</span>
            <img
              src="/logo_diktisaintek.jpeg"
              alt="Diktisaintek"
              className="h-8"
            />
            <span className="text-gray-400">|</span>
            <img
              src="/logo_sibima.png"
              alt="SIBIMA"
              className="h-8"
            />
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">Didanai oleh DPPM BIMA Kemdiktisaintek</span>
          </div>
          <div className="text-gray-500">
            Sistem Edukasi Aman berbasis Culturally Responsive MOOC
          </div>
        </div>
      </div>

      <nav className="bg-[#005696] text-white sticky top-0 z-50 shadow-md border-b-2 border-[#F7941E]">
        <div className="container mx-auto px-6 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo_sineda.png" alt="SINEDA" className="h-12" />
            <span className="font-bold text-xl leading-none text-white">SINEDA</span>
          </Link>

          <div className="hidden lg:flex gap-10 font-medium items-center">
            <Link href="/" className={navItemClass('/')} onClick={() => setActiveSection('home')}>Beranda</Link>
            <Link href="/guru" className={navItemClass('/guru')}>Guru</Link>
            <Link href="/siswa" className={navItemClass('/siswa')}>Siswa</Link>
            <Link href="/orangtua" className={navItemClass('/orangtua')}>Orang Tua</Link>

            {user ? (
              <div className="flex items-center gap-6 ml-4 pl-4 border-l border-white/20">
                {user.role === 'siswa_intervensi' && (
                  <Link href="/dashboard" className={`text-sm transition ${isUserMenuActive ? 'text-[#F7941E] font-semibold' : 'text-blue-200 hover:text-white'}`}>
                    Dashboard Saya
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin" className={`text-sm transition ${isUserMenuActive ? 'text-[#F7941E] font-semibold' : 'text-blue-200 hover:text-white'}`}>
                    Admin Panel
                  </Link>
                )}
                <span className="text-sm font-bold text-[#F7941E]/80">{userName}</span>
                <button onClick={() => setShowLogout(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition shadow-sm">
                  Keluar
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="bg-[#F7941E] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#e0861b] transition ml-4 shadow-sm">
                Masuk
              </Link>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#005696] border-t border-white/10 pb-4 px-6">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                className={`py-2.5 text-sm font-medium transition ${pathname === '/' || (isHome && activeSection === 'home') ? 'text-[#F7941E]' : 'text-blue-200 hover:text-white'}`}
                onClick={() => { setActiveSection('home'); setMobileMenuOpen(false) }}
              >
                Beranda
              </Link>
              <Link
                href="/guru"
                className={`py-2.5 text-sm font-medium transition ${pathname === '/guru' ? 'text-[#F7941E]' : 'text-blue-200 hover:text-white'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Guru
              </Link>
              <Link
                href="/siswa"
                className={`py-2.5 text-sm font-medium transition ${pathname === '/siswa' ? 'text-[#F7941E]' : 'text-blue-200 hover:text-white'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Siswa
              </Link>
              <Link
                href="/orangtua"
                className={`py-2.5 text-sm font-medium transition ${pathname === '/orangtua' ? 'text-[#F7941E]' : 'text-blue-200 hover:text-white'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Orang Tua
              </Link>
              <hr className="border-white/10 my-2" />
              {user ? (
                <>
                  {user.role === 'siswa_intervensi' && (
                    <Link
                      href="/dashboard"
                      className={`py-2.5 text-sm font-medium transition ${pathname === '/dashboard' || pathname.startsWith('/dashboard/') ? 'text-[#F7941E]' : 'text-blue-200 hover:text-white'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard Saya
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className={`py-2.5 text-sm font-medium transition ${pathname === '/admin' || pathname.startsWith('/admin/') ? 'text-[#F7941E]' : 'text-blue-200 hover:text-white'}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-[#F7941E]/80">{userName}</span>
                    <button
                      onClick={() => { setShowLogout(true); setMobileMenuOpen(false) }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition shadow-sm"
                    >
                      Keluar
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="bg-[#F7941E] text-white text-center px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#e0861b] transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
      {showLogout && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}
    </>
  )
}
