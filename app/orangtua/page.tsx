'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'


type Course = {
  id: number; title: string; slug: string; description: string
  category: string; type: string; lessons: number; duration: string
  icon: string; color: string
}

export default function OrangTuaPage() {
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetch('/api/courses?category=orangtua&published=true').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCourses(d)
    }).catch(() => {})
  }, [])

  return (
    <section className="flex-1 bg-orange-50 py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold mb-8 text-orange-600">Portal Wali Murid</h2>

          {courses.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {courses.map((course) => (
                <Link key={course.id} href={`/course/${course.id}`} className="block bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`h-44 ${course.color} flex items-center justify-center`}>
                    <i className={`fas ${course.icon} text-6xl text-white`}></i>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold text-lg mb-2 text-gray-800">{course.title}</h4>
                    <p className="text-sm text-gray-500 mb-5 line-clamp-2">{course.description}</p>
                    <div className="w-full py-3 bg-[#005696] text-white rounded-xl font-bold text-sm text-center">
                      Mulai Belajar
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {courses.length === 0 && (
            <div className="text-center py-20 text-gray-400 mb-12">
              <i className="fas fa-users text-5xl mb-6 block"></i>
              <p className="text-lg">Belum ada kursus untuk orang tua.</p>
            </div>
          )}

          <div className="bg-white p-8 rounded-3xl border border-orange-200 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-award text-4xl text-orange-400"></i>
            </div>
            <h4 className="font-bold text-xl mb-2 text-gray-800">Sertifikat Orang Tua Tangguh</h4>
            <p className="text-sm text-gray-500">Diberikan setelah menyelesaikan modul pendampingan.</p>
          </div>
        </div>
      </section>
  )
}
