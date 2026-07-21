'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCourses, getCourseStats, deleteCourse, saveCourseSortOrder } from '@/services/courses'
import { Reorder } from 'framer-motion'
import type { Course } from '@/types/course'

const catColors: Record<string, string> = {
  guru: 'bg-[#DBEAFE] text-[#005696]',
  siswa: 'bg-green-100 text-green-700',
  orangtua: 'bg-orange-100 text-orange-700',
}

export default function AdminKelolaCourse() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<{ total: number; published: number; draft: number; byCategory: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingOrder, setSavingOrder] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([getAllCourses(), getCourseStats()])
      .then(([c, s]) => {
        setCourses(c)
        setStats(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus course "${title}"?`)) return
    try {
      await deleteCourse(String(id))
      setCourses((prev) => prev.filter((c) => c.id !== id))
      const updatedStats = await getCourseStats()
      setStats(updatedStats)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus')
    }
  }

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      const updates = courses.map((c, i) => ({ id: c.id, sort_order: i }))
      await saveCourseSortOrder(updates)
      const fresh = await getAllCourses()
      setCourses(fresh)
    } catch {
      alert('Gagal menyimpan urutan')
    } finally {
      setSavingOrder(false)
    }
  }

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: 'Total Course', value: stats?.total ?? 0, icon: 'fa-book', bg: 'bg-[#DBEAFE]' },
    { label: 'Published', value: stats?.published ?? 0, icon: 'fa-check-circle', bg: 'bg-green-50' },
    { label: 'Draft', value: stats?.draft ?? 0, icon: 'fa-pen', bg: 'bg-amber-50' },
    { label: 'Kategori', value: Object.keys(stats?.byCategory ?? {}).length, icon: 'fa-tags', bg: 'bg-purple-50' },
  ]

  return (
    <div className="min-h-full font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#333333]">Kelola Course</h1>
        <div className="flex items-center gap-2">
          {courses.length > 0 && (
            <button
              onClick={handleSaveOrder}
              disabled={savingOrder}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#005696] hover:bg-[#003d6e] rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {savingOrder ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-save"></i>
              )}
              Simpan Urutan
            </button>
          )}
          <button
            onClick={() => router.push('/admin/course/new')}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-[#F7941E] hover:bg-[#e0861b] rounded-xl transition-colors shadow-sm"
          >
            <i className="fas fa-plus"></i> Tambah Course
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`${stat.bg} rounded-2xl p-5 text-center shadow-sm flex flex-col justify-center items-center`}
          >
            <i className={`fas ${stat.icon} text-gray-500 text-lg mb-1`}></i>
            <span className="text-3xl font-extrabold text-[#2C2C2C]">{stat.value}</span>
            <span className="text-xs text-gray-500 font-medium mt-0.5">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="relative max-w-xs mb-6">
        <input
          type="text"
          placeholder="Cari Course"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-[#005696] placeholder-gray-400 shadow-sm"
        />
        <i className="fas fa-search absolute right-3 top-2.5 text-gray-400"></i>
      </div>

      <div className="bg-white border-2 border-[#DBEAFE] rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {search ? 'Course tidak ditemukan.' : 'Belum ada course.'}
          </div>
        ) : search ? (
          <div className="divide-y-2 divide-[#F1F5F9]">
            {filtered.map((course) => (
              <div
                key={course.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-[#F8FAFC] transition-colors gap-4 bg-white"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-[#2C2C2C] mb-1 truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${catColors[course.category] || 'bg-gray-100 text-gray-600'}`}>
                        {course.category}
                      </span>
                      <span className="text-xs text-gray-400">&bull;</span>
                      <span className="text-xs text-gray-500">{course.type === 'self_paced' ? 'Belajar Mandiri' : course.type === 'interactive' ? 'Interaktif' : course.type === 'unsolved_case' ? 'Kasus Misterius' : course.type || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                  <div className="w-24">
                    {course.is_published ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <i className="fas fa-check-circle text-xs"></i> Publish
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <i className="fas fa-pen text-xs"></i> Draft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/course/${course.id}`)}
                      className="p-2 bg-[#005696] text-white rounded-lg hover:bg-[#003d6e] transition-colors"
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="p-2 bg-[#005696] text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Hapus"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={courses}
            onReorder={setCourses}
            className="divide-y-2 divide-[#F1F5F9]"
          >
            {courses.map((course) => (
              <Reorder.Item
                key={course.id}
                value={course}
                layout
                whileDrag={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                className="flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-[#F8FAFC] transition-colors gap-4 cursor-grab active:cursor-grabbing bg-white"
                style={{ listStyle: 'none' }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <i className="fas fa-grip-vertical text-gray-300 shrink-0 cursor-grab active:cursor-grabbing text-base"></i>
                  <div className="min-w-0">
                    <h3 className="font-bold text-base text-[#2C2C2C] mb-1 truncate">{course.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${catColors[course.category] || 'bg-gray-100 text-gray-600'}`}>
                        {course.category}
                      </span>
                      <span className="text-xs text-gray-400">&bull;</span>
                      <span className="text-xs text-gray-500">{course.type === 'self_paced' ? 'Belajar Mandiri' : course.type === 'interactive' ? 'Interaktif' : course.type === 'unsolved_case' ? 'Kasus Misterius' : course.type || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                  <div className="w-24">
                    {course.is_published ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <i className="fas fa-check-circle text-xs"></i> Publish
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        <i className="fas fa-pen text-xs"></i> Draft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/course/${course.id}`)}
                      className="p-2 bg-[#005696] text-white rounded-lg hover:bg-[#003d6e] transition-colors"
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="p-2 bg-[#005696] text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Hapus"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}
