'use client'

import { useEffect, useState } from 'react'
import CourseCard from '@/components/CourseCard'
import type { Course } from '@/types/course'

export default function OrangTuaPage() {
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetch('/api/courses?category=orangtua&published=true').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCourses(d)
    }).catch(() => {})
  }, [])

  return (
    <section className="flex-1 bg-[#FFF5E8] py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold mb-8 text-[#F7941E]">Portal Wali Murid</h2>

          {courses.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {courses.length === 0 && (
            <div className="text-center py-20 text-gray-400 mb-12">
              <i className="fas fa-users text-5xl mb-6 block"></i>
              <p className="text-lg">Belum ada kursus untuk orang tua.</p>
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-[#F7941E]/30 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-[#F7941E]/10 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-award text-4xl text-[#F7941E]"></i>
            </div>
            <h4 className="font-bold text-xl mb-2 text-gray-800">Sertifikat Orang Tua Tangguh</h4>
            <p className="text-sm text-gray-500">Diberikan setelah menyelesaikan modul pendampingan.</p>
          </div>
        </div>
      </section>
  )
}
