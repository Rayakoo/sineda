'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { getAccessToken } from '@/lib/supabaseClient'
import ConfirmModal from '@/app/components/ConfirmModal'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

type Profile = { id: string; full_name: string; role: string; email?: string; created_at: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [confirm, setConfirm] = useState<{ id: string; name: string; current: string; newRole: string } | null>(null)

  const load = async () => {
    const token = await getAccessToken().catch(() => null)
    const h = { apikey: SUPABASE_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`, { headers: h })
    if (res.ok) {
      const data = await res.json()
      setUsers(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleRole = useCallback(async (id: string, current: string) => {
    const newRole = current === 'admin' ? 'user' : 'admin'
    const token = await getAccessToken().catch(() => null)
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}), Prefer: 'return=minimal' },
      body: JSON.stringify({ role: newRole }),
    })
    setConfirm(null)
    load()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kelola Users</h1>
      {loading ? <div className="text-center py-20 text-gray-400">Memuat...</div> : (
        <div className="space-y-10">
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fas fa-shield-alt text-purple-600"></i> Admin
            </h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-6 py-3 font-semibold text-gray-600">Nama</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Role</th>
                    <th className="px-6 py-3 font-semibold text-gray-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u) => u.role === 'admin').map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{u.full_name || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setConfirm({ id: u.id, name: u.full_name || 'User', current: u.role, newRole: 'user' })} className="text-sm text-red-600 hover:underline font-medium">
                          Jadikan User
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter((u) => u.role === 'admin').length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Tidak ada admin</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fas fa-users text-blue-600"></i> Pengguna
            </h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-6 py-3 font-semibold text-gray-600">Nama</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Role</th>
                    <th className="px-6 py-3 font-semibold text-gray-600 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u) => u.role !== 'admin').map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{u.full_name || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{u.role}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => setConfirm({ id: u.id, name: u.full_name || 'User', current: u.role, newRole: 'admin' })} className="text-sm text-[#005696] hover:underline font-medium">
                          Jadikan Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter((u) => u.role !== 'admin').length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Tidak ada pengguna</div>
              )}
            </div>
          </div>
        </div>
      )}
      {confirm && (
        <ConfirmModal
          title={confirm.newRole === 'admin' ? 'Jadikan Admin' : 'Hapus Admin'}
          message={confirm.newRole === 'admin'
            ? `Yakin ingin menjadikan "${confirm.name}" sebagai Admin? User ini akan mendapat akses penuh ke panel admin.`
            : `Yakin ingin menghapus "${confirm.name}" dari Admin? User ini akan kehilangan akses ke panel admin.`}
          confirmLabel={confirm.newRole === 'admin' ? 'Ya, Jadikan Admin' : 'Ya, Hapus Admin'}
          confirmClass={confirm.newRole === 'admin' ? 'bg-[#005696] hover:bg-[#003d6e]' : 'bg-red-600 hover:bg-red-700'}
          icon={confirm.newRole === 'admin' ? 'fa-shield-alt' : 'fa-user-shield'}
          onConfirm={() => toggleRole(confirm.id, confirm.current)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
