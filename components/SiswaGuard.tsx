'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function SiswaGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      window.location.href = '/auth/login'
      return
    }
    if (user.role !== 'siswa_intervensi' && !isAdmin) {
      window.location.href = '/'
      return
    }
    setReady(true)
  }, [loading, user, isAdmin])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div>
      </div>
    )
  }

  return <>{children}</>
}
