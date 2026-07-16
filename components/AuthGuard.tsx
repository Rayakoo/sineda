'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4">
            <i className="fas fa-lock text-4xl text-gray-300 mb-4"></i>
            <h3 className="font-bold text-lg mb-2">Masuk untuk Belajar</h3>
            <p className="text-sm text-gray-500 mb-6">Gunakan akun Siswa Intervensi atau Admin untuk masuk.</p>
            <a
              href="/auth/login"
              className="inline-block bg-[#005696] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#003d6e] transition"
            >
              Masuk
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
