'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createBrowserClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    category: 'siswa',
    type: 'self_paced',
    lessons: 0,
    duration: '',
    icon: 'fa-book',
    color: 'bg-blue-600',
    is_published: false,
    sort_order: 0,
  })

  useEffect(() => {
    supabase
      .from('courses')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.push('/admin/courses')
          return
        }
        setForm({
          title: data.title,
          slug: data.slug || '',
          description: data.description || '',
          category: data.category,
          type: data.type,
          lessons: data.lessons || 0,
          duration: data.duration || '',
          icon: data.icon || 'fa-book',
          color: data.color || 'bg-blue-600',
          is_published: data.is_published,
          sort_order: data.sort_order || 0,
        })
        setLoading(false)
      })
  }, [params.id, supabase, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('courses')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    setSaving(false)
    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      router.push('/admin/courses')
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Memuat...</div>
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Edit Kursus</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kursus</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              >
                <option value="siswa">Siswa</option>
                <option value="guru">Guru</option>
                <option value="orangtua">Orang Tua</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              >
                <option value="self_paced">Belajar Mandiri</option>
                <option value="interactive">Interaktif</option>
                <option value="unsolved_case">Kasus Misterius</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pelajaran</label>
              <input
                type="number"
                value={form.lessons}
                onChange={(e) => setForm((f) => ({ ...f, lessons: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="w-4 h-4 text-[#005696]"
              />
              <span className="text-sm text-gray-700">Publikasikan</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#005696] text-white px-8 py-2.5 rounded-lg font-bold hover:bg-[#003d6e] transition disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
            className="px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
