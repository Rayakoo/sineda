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

        </div>
      </section>
  )
}
