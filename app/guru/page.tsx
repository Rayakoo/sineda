'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'


type Course = {
  id: number; title: string; slug: string; description: string
  category: string; type: string; lessons: number; duration: string
  icon: string; color: string
}

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
          <h2 className="text-3xl font-bold mb-2 text-[#005696]">Workshop Guru Profesional</h2>
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

          <div className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center p-10 text-center max-w-sm mx-auto">
            <i className="fas fa-award text-6xl text-blue-200 mb-4"></i>
            <h4 className="font-bold text-xl text-blue-400">Sertifikat Guru</h4>
            <p className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-medium">Misi belum lengkap (0/3)</p>
          </div>
        </div>
      </section>
  )
}
