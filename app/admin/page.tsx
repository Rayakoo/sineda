'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getCourseStats } from '@/services/courses'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<{ total: number; published: number; draft: number; byCategory: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCourseStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
    <>
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-6 shadow-sm border border-transparent`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{s.label}</p>
                <p className="text-4xl font-extrabold text-[#333333] mt-1">{s.value}</p>
              </div>
              <div className="w-12 h-12 bg-white/60 rounded-xl flex items-center justify-center">
                <i className={`fas ${s.icon} text-[#005696] text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border-2 border-[#DBEAFE] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-bold text-[#333333] mb-5">Akses Cepat</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button onClick={() => router.push('/admin/courses')} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#005696] hover:bg-[#F8FAFC] transition-all text-left">
              <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-book text-[#005696]"></i>
              </div>
              <span className="font-semibold text-[#333333]">Kelola Course</span>
            </button>
            <button onClick={() => router.push('/admin/course/new')} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#005696] hover:bg-[#F8FAFC] transition-all text-left">
              <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-plus text-[#005696]"></i>
              </div>
              <span className="font-semibold text-[#333333]">Tambah Course</span>
            </button>
            <button onClick={() => router.push('/admin/courses')} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-[#005696] hover:bg-[#F8FAFC] transition-all text-left">
              <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center shrink-0">
                <i className="fas fa-chart-bar text-[#005696]"></i>
              </div>
              <span className="font-semibold text-[#333333]">Statistik Course</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
