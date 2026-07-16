import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!client) {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return client
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(
    `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`
  )
  if (!raw) return null
  try {
    return JSON.parse(raw)?.access_token || null
  } catch {
    return null
  }
}

export async function getValidToken(): Promise<string | null> {
  const token = getAuthToken()
  if (!token) return null
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: supabaseKey },
    })
    if (res.ok) return token
  } catch {}
  return null
}

export async function getAccessToken(): Promise<string> {
  const token = getAuthToken()
  if (!token) throw new Error('Not authenticated')
  return token
}

export function getAuthHeaders(token?: string): Record<string, string> {
  return {
    apikey: supabaseKey,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  return fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
  }).then(async (r) => {
    if (!r.ok) throw new Error(`API error: ${r.status}`)
    const text = await r.text()
    if (!text) throw new Error('Empty response from server — mungkin perlu Prefer: return=representation')
    return JSON.parse(text)
  })
}
