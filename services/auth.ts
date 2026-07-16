import { getValidToken, getAccessToken } from '@/lib/supabaseClient'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const SISWA_SESSION_KEY = 'sineda-siswa-session'

type AuthResponse = { user: { id: string; email: string } | null; session: unknown }

export function getSiswaSession(): { id: string; name: string; role: string } | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SISWA_SESSION_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function signIn(email: string, password: string): Promise<{ user: { id: string; email: string }; role: string }> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Email atau password salah')
  const data = await res.json()
  localStorage.setItem(`sb-${SUPABASE_URL.split('//')[1]?.split('.')[0]}-auth-token`, JSON.stringify(data))
  let role = 'user'
  try {
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${data.user.id}&select=role`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${data.access_token}` },
    })
    if (profileRes.ok) {
      const profiles = await profileRes.json()
      role = profiles[0]?.role || 'user'
    }
  } catch {}
  return { user: data.user, role }
}

export async function siswaSignIn(name: string, kode: string): Promise<{ id: string; name: string; role: string }> {
  const res = await fetch('/api/auth/login-siswa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, kode }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Login gagal')
  }
  const data = await res.json()
  localStorage.setItem(SISWA_SESSION_KEY, JSON.stringify(data.user))
  return data.user
}

export async function signOut() {
  const token = await getAccessToken().catch(() => null)
  if (token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  const key = Object.keys(localStorage).find((k) => k.includes('-auth-token'))
  if (key) localStorage.removeItem(key)
  localStorage.removeItem(SISWA_SESSION_KEY)
}

export async function getCurrentUser(): Promise<{ id: string; email?: string; name?: string; role: string } | null> {
  // Check siswa_intervensi session first
  const siswa = getSiswaSession()
  if (siswa) return { id: siswa.id, name: siswa.name, role: siswa.role }

  // Check Supabase auth
  const token = await getValidToken()
  if (!token) return null
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  const user = data.id ? data : null
  if (!user) return null
  let role = 'user'
  try {
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
    })
    if (profileRes.ok) {
      const profiles = await profileRes.json()
      role = profiles[0]?.role || 'user'
    }
  } catch {}
  return { id: user.id, email: user.email, role }
}
