'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, siswaSignIn } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'

type Tab = 'admin' | 'siswa'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [kode, setKode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (tab === 'admin') {
        const { role } = await signIn(email, password)
        await refreshUser()
        router.push(role === 'admin' ? '/admin' : '/')
      } else {
        await siswaSignIn(name, kode)
        await refreshUser()
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Link href="/" className="text-sm text-[#005696] hover:underline mb-4 inline-block">
          <i className="fas fa-arrow-left mr-1"></i> Kembali
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="bg-[#005696] p-1.5 rounded">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-[#005696] font-bold">S</div>
            </div>
            <span className="font-bold text-xl">SINEDA</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Selamat Datang</h1>
          <p className="text-sm text-gray-500 mt-1">Masuk ke akun SINEDA Anda</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setTab('admin'); setError('') }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${tab === 'admin' ? 'bg-white shadow-sm text-[#005696]' : 'text-gray-500'}`}
          >
            Admin / Guru
          </button>
          <button
            onClick={() => { setTab('siswa'); setError('') }}
            className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${tab === 'siswa' ? 'bg-white shadow-sm text-[#005696]' : 'text-gray-500'}`}
          >
            Siswa Intervensi
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'admin' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#005696]"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#005696]"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#005696]"
                  placeholder="Nama sesuai database"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kode Password</label>
                <input
                  type="password"
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#005696]"
                  placeholder="Masukkan kode password"
                />
              </div>
            </>
          )}

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#005696] text-white font-bold py-2.5 rounded-lg hover:bg-[#003d6e] transition disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
      </div>
    </div>
  )
}
