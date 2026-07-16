'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserCourses } from '@/services/userCourses'
import Link from 'next/link'


export default function SiswaDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || (user.role !== 'siswa_intervensi' && user.role !== 'admin')) {
      router.replace('/auth/login')
      return
    }
    getUserCourses(user.id).then((data) => {
      setEnrolledCourses(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user?.id, authLoading])

  return (
    <section className="bg-gray-100 py-12 min-h-screen">
        <div className="container mx-auto px-6 lg:px-12 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Halo, {user?.name || 'Siswa'}!
            </h1>
            <p className="text-gray-500 mt-1">Selamat datang di Zona Misi Siswa SINEDA.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl text-gray-800">Kursus Saya</h2>
              <Link href="/" className="text-sm text-[#005696] hover:underline">
                Cari Kursus Lain
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">Memuat...</div>
            ) : enrolledCourses.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-book-open text-5xl mb-4 block"></i>
                <p className="text-lg mb-4">Belum ada kursus yang diambil.</p>
                <Link href="/" className="inline-block bg-[#005696] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#003d6e] transition">
                  Jelajahi Kursus
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {enrolledCourses.map((uc: any) => (
                  <div key={uc.id} className="border rounded-xl p-5 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{uc.courses?.title || 'Kursus'}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          uc.is_completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {uc.is_completed ? 'Selesai' : 'Sedang Berjalan'}
                        </span>
                        {uc.courses?.lessons && (
                          <span>{uc.current_urutan || 0} / {uc.courses.lessons} materi</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/course/${uc.course_id}/materi`}
                      className="shrink-0 bg-[#005696] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#003d6e] transition"
                    >
                      Lanjutkan
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <i className="fas fa-gamepad text-4xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black uppercase italic">Game: Unsolved Case</h3>
                <p className="text-purple-200 text-sm mt-1">Selesaikan misi investigasi dan dapatkan 1000 XP!</p>
              </div>
              <Link
                href="/"
                className="shrink-0 bg-white text-purple-700 px-6 py-3 rounded-xl font-extrabold hover:bg-purple-100 transition"
              >
                MULAI MISI
              </Link>
            </div>
          </div>
        </div>
      </section>
  )
}
