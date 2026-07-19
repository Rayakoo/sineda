'use client'

import Link from 'next/link'
import { useNav } from '@/contexts/NavContext'

export default function SiteFooter() {
  const { setActiveSection } = useNav()

  return (
    <footer className="bg-[#00335c] text-white pt-16 pb-8 border-t-4 border-[#F7941E]">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-12 mb-12">
          <div>
            <img src="/logo_sineda.png" alt="SINEDA" className="h-12 mb-6" />
            <p className="text-sm text-blue-200">
              SINEDA (Sistem Edukasi Aman) adalah platform edukasi inovatif untuk menciptakan lingkungan sekolah yang aman.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">Navigasi Cepat</h4>
            <ul className="space-y-4 text-sm text-blue-200">
              <li>
                <Link href="/" className="cursor-pointer hover:text-white transition" onClick={() => setActiveSection('guru')}>
                  Workshop Guru
                </Link>
              </li>
              <li>
                <Link href="/" className="cursor-pointer hover:text-white transition" onClick={() => setActiveSection('siswa')}>
                  Misi Siswa
                </Link>
              </li>
              <li>
                <Link href="/" className="cursor-pointer hover:text-white transition" onClick={() => setActiveSection('orangtua')}>
                  Panduan Wali Murid
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-6">Lokasi</h4>
            <p className="text-sm text-blue-200">
              <i className="fas fa-map-marker-alt mr-2"></i> SMP Negeri 2 Singosari, Malang
            </p>
            <p className="text-xs text-blue-300 uppercase font-bold mt-8">
              Didanai oleh: DPPM BIMA Kemdiktisaintek
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-xs text-blue-400">
          &copy; 2026 SINEDA - Sistem Edukasi Aman. All Rights Reserved.
        </div>
      </div>
    </footer>
  )
}
