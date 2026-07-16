'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getCourse } from '@/services/courses'
import { useAuth } from '@/contexts/AuthContext'
import type { Course } from '@/types/course'

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)

  const score = Number(searchParams.get('score')) || 0
  const total = Number(searchParams.get('total')) || 0
  const passed = score >= 70

  useEffect(() => {
    getCourse(params.id as string).then(setCourse)
  }, [params.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          <i className={`fas ${passed ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-5xl`}></i>
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? 'Selamat!' : 'Belum Lulus'}
        </h1>
        <p className="text-gray-500 mb-2">{passed ? 'Kamu berhasil menyelesaikan quiz dengan baik' : 'Coba lagi ya, semangat!'}</p>
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <p className="text-sm text-gray-400 mb-1">Nilai Kamu</p>
          <p className="text-5xl font-bold text-gray-800">{score}<span className="text-2xl text-gray-400">/100</span></p>
          <p className="text-sm text-gray-400 mt-2">{total} soal</p>
        </div>

        {passed && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <i className="fas fa-trophy text-4xl text-yellow-500 mb-2"></i>
            <h2 className="font-bold text-gray-800 mb-1">Sertifikat</h2>
            <p className="text-sm text-gray-500 mb-4">Kamu berhasil menyelesaikan quiz ini!</p>
            <div className="border-2 border-dashed border-yellow-300 rounded-xl p-4 bg-white/60">
              <p className="font-semibold text-gray-700">{course?.title || 'Sertifikat'}</p>
              <p className="text-xs text-gray-400 mt-1">Atas nama {user?.name || user?.email?.split('@')[0] || 'Pengguna'}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href={`/course/${params.id}/${params.quizId}`}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition font-medium">
            {passed ? 'Coba Lagi' : 'Ulang Quiz'}
          </Link>
          <Link href={`/course/${params.id}/materi`}
            className="px-6 py-3 rounded-xl bg-[#005696] text-white font-bold hover:bg-[#003d6e] transition">
            Kembali ke Materi
          </Link>
        </div>
      </div>
    </div>
  )
}
