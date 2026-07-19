'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import CourseCard from '@/components/CourseCard'
import type { Course } from '@/types/course'

export default function SiswaPage() {
  const { user, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetch('/api/courses?category=siswa&published=true').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCourses(d)
    }).catch(() => {})
  }, [])

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div></div>
    )
  }

  const canAccess = user && (user.role === 'siswa_intervensi' || user.role === 'admin')

  if (!canAccess) {
    return (
      <section className="flex-1 bg-white py-20">
          <div className="container mx-auto px-4 text-center">
            <i className="fas fa-lock text-5xl text-gray-300 mb-4 block"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Zona Misi Siswa</h2>
            <p className="text-gray-500 mb-6">Silakan masuk menggunakan akun Siswa Intervensi.</p>
            <Link href="/auth/login" className="inline-block bg-[#F7941E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e0861b] transition">
              Masuk
            </Link>
          </div>
        </section>
    )
  }

  return (
    <section className="flex-1 bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-10 text-green-700">Zona Misi Siswa</h2>

          <div className="bg-slate-900 rounded-[2rem] p-8 mb-16 text-white flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <h3 className="text-4xl font-black text-[#F7941E] mb-4 uppercase italic">Game: Unsolved Case</h3>
              <p className="text-gray-400 mb-6 italic">
                &ldquo;Selesaikan misi investigasi kasus sekolah dan kumpulkan 1000 XP untuk mendapatkan Sertifikat Pahlawan Sekolah!&rdquo;
              </p>
              <button className="bg-[#F7941E] px-10 py-3 rounded-full font-extrabold hover:scale-105 transition">
                MULAI MISI
              </button>
            </div>
            <div className="w-full md:w-1/4 h-48 bg-slate-800 rounded-3xl flex items-center justify-center border-4 border-slate-700">
              <i className="fas fa-gamepad text-7xl text-slate-600"></i>
            </div>
          </div>

          {courses.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {courses.length === 0 && (
            <div className="text-center py-20 text-gray-400 mb-12">
              <i className="fas fa-graduation-cap text-5xl mb-6 block"></i>
              <p className="text-lg">Belum ada kursus untuk siswa.</p>
            </div>
          )}

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto opacity-60">
            <i className="fas fa-certificate text-5xl text-gray-300 mb-3"></i>
            <h4 className="font-bold text-base text-gray-400 uppercase tracking-wider">Sertifikat Pahlawan Belum Tersedia</h4>
            <p className="text-[11px] text-gray-400 mt-2">Selesaikan misi game untuk mendapatkan sertifikat</p>
          </div>
        </div>
      </section>
  )
}
