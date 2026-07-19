'use client'

import { useEffect, useState, useMemo } from 'react'

type ReportUser = {
  id: string
  name: string
  type: 'auth' | 'siswa_intervensi'
  created_at: string
  enrollments: {
    course_id: number
    course_title: string
    course_lessons: number
    current_urutan: number
    is_completed: boolean
    completed_at: string | null
  }[]
  quizResults: {
    quiz_id: string
    quiz_title: string
    course_title: string
    score: number
    total: number
    passed: boolean
    created_at: string
  }[]
}

export default function AdminReportsPage() {
  const [users, setUsers] = useState<ReportUser[]>([])
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'auth' | 'siswa_intervensi'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/reports')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || [])
        setCourses(data.courses || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (typeFilter !== 'all' && u.type !== typeFilter) return false
      if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [users, search, typeFilter])

  const stats = useMemo(() => {
    const total = users.length
    const enrolled = users.filter((u) => u.enrollments.length > 0).length
    const completed = users.filter((u) => u.enrollments.some((e) => e.is_completed)).length
    const totalEnrollments = users.reduce((s, u) => s + u.enrollments.length, 0)
    return { total, enrolled, completed, totalEnrollments }
  }, [users])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[#333333] mb-8">Laporan Progress Siswa</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#DBEAFE] rounded-2xl p-6 shadow-sm border border-transparent">
          <p className="text-sm font-medium text-gray-500">Total Siswa</p>
          <p className="text-4xl font-extrabold text-[#333333] mt-1">{stats.total}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-transparent">
          <p className="text-sm font-medium text-gray-500">Pernah Belajar</p>
          <p className="text-4xl font-extrabold text-[#333333] mt-1">{stats.enrolled}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-6 shadow-sm border border-transparent">
          <p className="text-sm font-medium text-gray-500">Total Enrollment</p>
          <p className="text-4xl font-extrabold text-[#333333] mt-1">{stats.totalEnrollments}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-6 shadow-sm border border-transparent">
          <p className="text-sm font-medium text-gray-500">Selesai 1+ Course</p>
          <p className="text-4xl font-extrabold text-[#333333] mt-1">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#005696]"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'auth', 'siswa_intervensi'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  typeFilter === t
                    ? 'bg-[#005696] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'Semua' : t === 'auth' ? 'User Biasa' : 'Siswa Intervensi'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-6 py-3 font-semibold text-gray-600">Nama</th>
                <th className="px-6 py-3 font-semibold text-gray-600">Tipe</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-center">Enrolled</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-center">Completed</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-center">Quiz Dikerjakan</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-center">Rata-rata Skor</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-center">Progress</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const enrolled = u.enrollments.length
                const completed = u.enrollments.filter((e) => e.is_completed).length
                const quizCount = u.quizResults.length
                const avgScore = quizCount > 0
                  ? Math.round(u.quizResults.reduce((s, r) => s + r.score, 0) / quizCount)
                  : 0
                const isExpanded = expandedId === u.id

                return (
                  <tr key={u.id} className={`border-b hover:bg-gray-50 cursor-pointer transition ${isExpanded ? 'bg-blue-50' : ''}`} onClick={() => setExpandedId(isExpanded ? null : u.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${u.type === 'siswa_intervensi' ? 'bg-orange-400' : 'bg-blue-500'}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${u.type === 'siswa_intervensi' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.type === 'siswa_intervensi' ? 'Intervensi' : 'Biasa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold">{enrolled}</td>
                    <td className="px-6 py-4 text-center font-semibold">{completed}</td>
                    <td className="px-6 py-4 text-center font-semibold">{quizCount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${avgScore >= 70 ? 'text-green-600' : avgScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {avgScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {enrolled > 0 ? (
                        <div className="w-20 mx-auto bg-gray-200 rounded-full h-2">
                          <div className="bg-[#005696] h-2 rounded-full" style={{ width: `${Math.round((completed / enrolled) * 100)}%` }}></div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-gray-400 text-xs`}></i>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <i className="fas fa-users text-5xl mb-4 block"></i>
          <p>Tidak ada data siswa</p>
        </div>
      )}

      {expandedId && (() => {
        const u = users.find((x) => x.id === expandedId)
        if (!u) return null
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40" onClick={() => setExpandedId(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="shrink-0 p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.type === 'siswa_intervensi' ? 'bg-orange-400' : 'bg-blue-500'}`}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{u.name}</h3>
                    <p className="text-xs text-gray-400">{u.type === 'siswa_intervensi' ? 'Siswa Intervensi' : 'User Biasa'}</p>
                  </div>
                </div>
                <button onClick={() => setExpandedId(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <i className="fas fa-times text-gray-400"></i>
                </button>
              </div>

              <div className="p-6 space-y-8 overflow-y-auto">
                <div>
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <i className="fas fa-book text-[#005696]"></i> Course ({u.enrollments.length})
                  </h4>
                  {u.enrollments.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Belum mengambil course apapun</p>
                  ) : (
                    <div className="space-y-2">
                      {u.enrollments.map((e, i) => {
                        const progress = e.course_lessons > 0 ? Math.min(100, Math.round((e.current_urutan / e.course_lessons) * 100)) : 0
                        return (
                          <div key={i} className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
                            <div className={`w-2 h-2 rounded-full ${e.is_completed ? 'bg-green-500' : 'bg-[#F7941E]'}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{e.course_title}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-[200px]">
                                  <div
                                    className="bg-[#F7941E] h-1.5 rounded-full transition-all"
                                    style={{ width: `${e.is_completed ? 100 : progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {e.is_completed ? 'Selesai' : `${e.current_urutan}/${e.course_lessons}`}
                                </span>
                              </div>
                            </div>
                            {e.is_completed && (
                              <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full shrink-0">Selesai</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <i className="fas fa-tasks text-purple-600"></i> Hasil Quiz ({u.quizResults.length})
                  </h4>
                  {u.quizResults.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Belum mengerjakan quiz apapun</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left">
                            <th className="px-4 py-2 font-semibold text-gray-600">Course</th>
                            <th className="px-4 py-2 font-semibold text-gray-600">Quiz</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-center">Skor</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-center">Jumlah Soal</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-center">Nilai</th>
                            <th className="px-4 py-2 font-semibold text-gray-600 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {u.quizResults.map((r, i) => (
                            <tr key={i} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 text-xs text-gray-500">{r.course_title}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{r.quiz_title}</td>
                              <td className="px-4 py-3 text-center">{r.score}</td>
                              <td className="px-4 py-3 text-center">{r.total}</td>
                              <td className="px-4 py-3 text-center font-bold">{r.score}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {r.passed ? 'Lulus' : 'Tidak Lulus'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
