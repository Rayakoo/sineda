'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getCurrentUser, signOut as authSignOut } from '@/services/auth'

type User = { id: string; email?: string; name?: string; role: string }

type AuthContextType = {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isSiswa: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSiswa: false,
  refreshUser: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser()
    setUser(u)
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const logout = useCallback(async () => {
    await authSignOut()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin: user?.role === 'admin', isSiswa: user?.role === 'siswa_intervensi', refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
