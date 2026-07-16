'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useNav } from '@/contexts/NavContext'
import LogoutModal from './LogoutModal'

export default function SiteHeader() {
  const [showLogout, setShowLogout] = useState(false)
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
      return `py-2 transition-colors ${isActive ? 'text-[#fbbf24] border-b-2 border-[#fbbf24]' : 'nav-link'}`
    }
    const isRouteActive = pathname === path || (path !== '/' && pathname.startsWith(path))
    return `py-2 transition-colors ${isRouteActive ? 'text-[#fbbf24] border-b-2 border-[#fbbf24]' : 'nav-link'}`
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
              src="https://upload.wikimedia.org/wikipedia/commons/b/b3/Logo_Kemdikbud.png"
              alt="Kemdikbud"
              className="h-8"
            />
            <span className="text-gray-400">|</span>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT46l9z6J8x6EMI4N_j-LK_0A3Bfq7jS38LOQ&s"
              alt="BIMA"
              className="h-6"
            />
          </div>
          <div className="flex items-center gap-3">
            <i className="fas fa-phone-alt text-gray-400"></i>
            <span className="text-gray-500">(0341) 123456</span>
            <span className="text-gray-300">|</span>
            <i className="fas fa-envelope text-gray-400"></i>
            <span className="text-gray-500">info@sineda.sch.id</span>
          </div>
        </div>
      </div>

      <nav className="bg-[#005696] text-white sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center h-14">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-white p-1 rounded">
              <div className="w-10 h-10 bg-[#005696] rounded flex items-center justify-center text-white font-bold text-lg">S</div>
            </div>
            <div>
              <h1 className="font-bold text-xl leading-none">SINEDA</h1>
              <p className="text-[10px] tracking-widest uppercase">Sistem Edukasi Aman</p>
            </div>
          </Link>

          <div className="hidden lg:flex gap-8 font-medium items-center">
            <Link href="/" className={navItemClass('/')} onClick={() => setActiveSection('home')}>Beranda</Link>
            <Link href="/guru" className={navItemClass('/guru')}>Guru</Link>
            <Link href="/siswa" className={navItemClass('/siswa')}>Siswa</Link>
            <Link href="/orangtua" className={navItemClass('/orangtua')}>Orang Tua</Link>

            {user ? (
              <div className="flex items-center gap-6 ml-4 pl-4 border-l border-white/20">
                {user.role === 'siswa_intervensi' && (
                  <Link href="/dashboard" className={`text-sm transition ${isUserMenuActive ? 'text-[#fbbf24] font-semibold' : 'text-blue-200 hover:text-white'}`}>
                    Dashboard Saya
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin" className={`text-sm transition ${isUserMenuActive ? 'text-[#fbbf24] font-semibold' : 'text-blue-200 hover:text-white'}`}>
                    Admin Panel
                  </Link>
                )}
                <span className="text-sm font-bold text-[#fbbf24]/80">{userName}</span>
                <button onClick={() => setShowLogout(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition shadow-sm">
                  Keluar
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="bg-white text-[#005696] px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition ml-4">
                Masuk
              </Link>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            {user ? (
              <button onClick={() => setShowLogout(true)} className="bg-red-600 px-3 py-1.5 rounded-lg text-sm font-medium">Keluar</button>
            ) : (
              <Link href="/auth/login" className="bg-white text-[#005696] px-3 py-1.5 rounded-lg font-bold text-sm">Masuk</Link>
            )}
          </div>
        </div>
      </nav>
      {showLogout && (
        <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />
      )}
    </>
  )
}
