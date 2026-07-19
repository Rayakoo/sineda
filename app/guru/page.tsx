'use client'

import { useEffect, useState } from 'react'
import CourseCard from '@/components/CourseCard'
import type { Course } from '@/types/course'

export default function GuruPage() {
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetch('/api/courses?category=guru&published=true').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCourses(d)
    }).catch(() => {})
  }, [])

  return (
    <section className="flex-1 bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2 text-[#005696]">
            Workshop Guru Profesional
            <span className="block w-16 h-1 bg-[#F7941E] rounded-full mt-2"></span>
          </h2>
          <p className="text-gray-600 mb-10 italic font-medium text-sm">
            &ldquo;Selesaikan 3 Misi Pelatihan untuk Klaim Sertifikat Pendidik SINEDA&rdquo;
          </p>

          {courses.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <i className="fas fa-book-open text-5xl mb-6 block"></i>
              <p className="text-lg">Belum ada kursus untuk guru.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center p-10 text-center max-w-sm mx-auto">
            <i className="fas fa-award text-6xl text-blue-200 mb-4"></i>
            <h4 className="font-bold text-xl text-blue-400">Sertifikat Guru</h4>
            <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-medium">Misi belum lengkap (0/3)</p>
          </div>
        </div>
      </section>
  )
}
