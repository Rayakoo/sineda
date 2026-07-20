'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useNav } from '@/contexts/NavContext'
import CourseCard from '@/components/CourseCard'
import type { Course } from '@/types/course'

type SessionId = 'home' | 'guru' | 'siswa' | 'orangtua'

type SessionModule = {
  title: string
  desc: string
  icon: string
  color: string
  type?: string
  badge?: string
  disabled?: boolean
}

type SessionData = {
  key: string
  title: string
  subtitle: string
  hero_title: string
  hero_description: string
  modules: SessionModule[]
}

const cardColors: Record<string, { bg: string; border: string; text: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600' },
  green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-600' },
}

const staticSessions: SessionData[] = [
  {
    key: 'home', title: 'Beranda', subtitle: 'Selamat Datang di SINEDA 2026',
    hero_title: 'Mewujudkan Sekolah Tanpa Kekerasan Seksual & Bullying',
    hero_description: 'Culturally Responsive MOOC berbasis Self-paced Learning untuk SMP Negeri 2 Singosari dan Sekolah Menengah Nasional.',
    modules: [
      { title: 'Portal Guru', desc: 'Workshop & Sertifikasi Strategi Penanganan Kekerasan.', icon: 'chalkboard-teacher', color: 'blue' },
      { title: 'Portal Siswa', desc: 'Mainkan Games & Selesaikan Misi Pahlawan Sekolah.', icon: 'user-graduate', color: 'green' },
      { title: 'Portal Orang Tua', desc: 'Edukasi & Panduan Perlindungan Anak di Rumah.', icon: 'users', color: 'orange' },
    ],
  },
  {
    key: 'guru', title: 'Workshop Guru Profesional',
    subtitle: '', hero_title: '', hero_description: '',
    modules: [
      { title: 'Modul: Strategi Kelas Aman', desc: 'Materi teknis identifikasi kekerasan seksual di lingkungan sekolah.', icon: 'book-open', color: 'blue' },
      { title: 'Workshop: Sinkronisasi Budaya Malang', desc: 'Integrasi nilai Topeng Malangan dalam edukasi anti-bullying.', icon: 'users', color: 'blue', badge: 'LIVE WORKSHOP' },

    ],
  },
  {
    key: 'siswa', title: 'Zona Misi Siswa', subtitle: '', hero_title: '', hero_description: '',
    modules: [
      { title: 'Modul: Kenali Batasan', desc: 'Belajar menjaga diri dengan cara seru.', icon: 'graduation-cap', color: 'green' },
      { title: 'Flash Cards Edukasi', desc: '"Sentuhan boleh, sentuhan tidak boleh!"', icon: 'images', color: 'green' },

    ],
  },
  {
    key: 'orangtua', title: 'Portal Wali Murid', subtitle: '', hero_title: '', hero_description: '',
    modules: [
      { title: 'Modul: Perlindungan dari Rumah', desc: 'Cara mendeteksi perubahan perilaku anak dan pola asuh yang aman.', icon: 'home', color: 'orange' },

    ],
  },
]

export default function HomeClient() {
  const { user, loading: authLoading } = useAuth()
  const { activeSection, setActiveSection } = useNav()
  const active = activeSection as SessionId
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    fetch('/api/courses?published=true').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setCourses(d) }).catch(() => {})
  }, [])

  const handleNavClick = useCallback((id: string) => {
    setActiveSection(id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setActiveSection])

  const sessionMap: Record<string, SessionData> = {}
  staticSessions.forEach((s) => { sessionMap[s.key] = s })

  const guruCourses = courses.filter((c) => c.category === 'guru')
  const siswaCourses = courses.filter((c) => c.category === 'siswa')
  const orangtuaCourses = courses.filter((c) => c.category === 'orangtua')

  return (
    <>
      <div className={active === 'home' ? 'session-active' : 'hidden'}>
        <HomeSession data={sessionMap.home} onNavClick={handleNavClick} />
      </div>
      <div className={active === 'guru' ? 'session-active' : 'hidden'}>
        <GuruSession data={sessionMap.guru} courses={guruCourses} />
      </div>
      <div className={active === 'siswa' ? 'session-active' : 'hidden'}>
        <SiswaSession data={sessionMap.siswa} courses={siswaCourses} user={user} authLoading={authLoading} />
      </div>
      <div className={active === 'orangtua' ? 'session-active' : 'hidden'}>
        <OrangTuaSession data={sessionMap.orangtua} courses={orangtuaCourses} />
      </div>
    </>
  )
}

function HomeSession({ data, onNavClick }: { data?: SessionData; onNavClick: (id: string) => void }) {
  const modules = data?.modules || []
  const sessionIds = ['guru', 'siswa', 'orangtua']
  return (
    <>
      <section className="relative hero-gradient text-white overflow-hidden py-16 lg:py-24">
        <div className="absolute right-[-5%] top-[10%] opacity-10 w-[400px] pointer-events-none">
          <i className="fas fa-spa text-[200px]"></i>
        </div>
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wider">
              {data?.subtitle || 'Selamat Datang di SINEDA 2026'}
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
              {data?.hero_title || 'Mewujudkan Sekolah Tanpa Kekerasan Seksual & Bullying'}
            </h2>
            <p className="text-lg text-blue-100 font-light">
              {data?.hero_description || 'Culturally Responsive MOOC berbasis Self-paced Learning untuk SMP Negeri 2 Singosari dan Sekolah Menengah Nasional.'}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavClick('guru')}
                className="bg-white text-blue-700 px-8 py-3 rounded-full font-bold hover:bg-gray-100 shadow-lg"
              >
                Mulai Belajar
              </button>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
            <div className="aspect-video">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/Ygf_lU5axJY?autoplay=1&mute=1"
                allow="autoplay; fullscreen"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-12">Pilih Jalur Belajar</h3>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {modules.map((mod, i) => {
              const cc = cardColors[mod.color] || cardColors.blue
              return (
                <div
                  key={i}
                  onClick={() => onNavClick(sessionIds[i] || 'guru')}
                  className={`p-8 ${cc.bg} rounded-2xl ${cc.border} border-b-4 card-hover cursor-pointer`}
                >
                  <i className={`fas fa-${mod.icon} text-4xl ${cc.text} mb-4`}></i>
                  <h4 className="font-bold mb-2">{mod.title}</h4>
                  <p className="text-sm text-gray-600">{mod.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}

function GuruSession({ data, courses }: { data?: SessionData; courses: Course[] }) {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-2 text-[#005696]">
          {data?.title || 'Workshop Guru Profesional'}
          <span className="block w-16 h-1 bg-[#F7941E] rounded-full mt-2"></span>
        </h2>
        {data?.subtitle && (
          <p className="text-gray-600 mb-10 italic font-medium text-sm">{data.subtitle}</p>
        )}

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

      </div>
    </section>
  )
}

function SiswaSession({ data, courses, user, authLoading }: { data?: SessionData; courses: Course[]; user: any; authLoading: boolean }) {
  const canAccess = user && (user.role === 'siswa_intervensi' || user.role === 'admin')
  const [filter, setFilter] = useState<'all' | 'unsolved_case'>('all')
  const gridRef = useRef<HTMLDivElement>(null)
  const filteredCourses = filter === 'unsolved_case' ? courses.filter((c) => c.type === 'unsolved_case') : courses

  if (authLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center py-20 text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696] mx-auto"></div>
        </div>
      </section>
    )
  }

  if (!canAccess) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center py-20">
          <i className="fas fa-lock text-5xl text-gray-300 mb-4 block"></i>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{data?.title || 'Zona Misi Siswa'}</h3>
          <p className="text-gray-500 mb-6">Silakan masuk menggunakan akun Siswa Intervensi untuk mengakses materi.</p>
          <Link href="/auth/login" className="inline-block bg-[#F7941E] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#e0861b] transition">
            Masuk
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-green-700">{data?.title || 'Zona Misi Siswa'}</h2>

          <div className="bg-slate-900 rounded-[2rem] p-8 mb-16 text-white flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h3 className="text-4xl font-black text-[#F7941E] mb-4 uppercase italic">Game: Unsolved Case</h3>
            <p className="text-gray-400 mb-6 italic">
              &ldquo;Selesaikan misi investigasi kasus sekolah dan kumpulkan 1000 XP!&rdquo;
            </p>
            <button
              onClick={() => { setFilter('unsolved_case'); gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="bg-[#F7941E] px-10 py-3 rounded-full font-extrabold hover:scale-105 transition"
            >
              MULAI MISI
            </button>
          </div>
          <div className="w-full md:w-1/4 h-48 bg-slate-800 rounded-3xl flex items-center justify-center border-4 border-slate-700">
            <i className="fas fa-gamepad text-7xl text-slate-600"></i>
          </div>
        </div>

        <div ref={gridRef}>
          {filter === 'unsolved_case' && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500 italic">Menampilkan kursus kasus misterius</p>
              <button onClick={() => setFilter('all')}
                className="px-4 py-2 rounded-xl bg-[#005696] text-white text-sm font-bold hover:bg-[#003d6e] transition-all shadow-sm">
                Kembali
              </button>
            </div>
          )}
          {filteredCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 mb-12">
              <i className="fas fa-graduation-cap text-5xl mb-6 block"></i>
              <p className="text-lg">Belum ada kursus untuk siswa.</p>
            </div>
          )}
        </div>

      </div>
    </section>
  )
}

function OrangTuaSession({ data, courses }: { data?: SessionData; courses: Course[] }) {
  return (
    <section className="py-20 bg-[#FFF5E8]">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl font-bold mb-8 text-[#F7941E]">{data?.title || 'Portal Wali Murid'}</h2>

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
