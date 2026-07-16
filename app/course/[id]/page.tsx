'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { getCourse } from '@/services/courses'
import type { Course } from '@/types/course'

export default function CourseDetailPage() {
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCourse(params.id as string).then((c) => {
      setCourse(c)
      setLoading(false)
    })
  }, [params.id])

  if (loading) return <div className="flex-1 flex items-center justify-center py-32"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div></div>

  if (!course) return <div className="flex-1 text-center py-32 text-gray-400">Course tidak ditemukan</div>

  const requireAuth = course.category === 'siswa'

  const content = (
    <section className="bg-gray-100 py-12 min-h-screen">
        <div className="container mx-auto px-4">
          <Link href="/" className="text-sm text-[#005696] hover:underline mb-4 inline-block">
            <i className="fas fa-arrow-left mr-1"></i> Kembali
          </Link>
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className={`h-48 ${course.color} flex items-center justify-center`}>
              {course.image ? (
                <img src={course.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <i className={`fas ${course.icon} text-8xl text-white/30`}></i>
              )}
            </div>
            <div className="p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
                  <p className="text-gray-600 mb-6 max-w-2xl">{course.description}</p>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium capitalize">{course.category}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{course.type === 'interactive' ? 'Interaktif' : course.type === 'unsolved_case' ? 'Kasus Misterius' : 'Belajar Mandiri'}</span>
                    {course.lessons > 0 && <span className="bg-gray-100 px-3 py-1 rounded-full">{course.lessons} Pelajaran</span>}
                    {course.duration && <span className="bg-gray-100 px-3 py-1 rounded-full">{course.duration}</span>}
                  </div>
                </div>
                <div className="shrink-0">
                  <Link href={`/course/${course.id}/materi`}
                    className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition">
                    Mulai Belajar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )

  if (requireAuth) {
    return <AuthGuard>{content}</AuthGuard>
  }
  return content
}
