'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCourse, createCourse, updateCourse, getCourseVideos, getCourseMaterials, getQuizzes, getCourseMinigames, deleteCourseVideo, deleteCourseMaterial, deleteQuiz, deleteCourseMinigame, saveSectionOrder } from '@/services/courses'
import type { Course, CourseVideo, CourseMaterial, Quiz, CourseMinigame, OrderedSection } from '@/types/course'

const CATEGORIES = [
  { value: 'guru', label: 'Guru', desc: 'Untuk tenaga pendidik' },
  { value: 'siswa', label: 'Siswa', desc: 'Untuk peserta didik' },
  { value: 'orangtua', label: 'Orang Tua', desc: 'Untuk wali murid' },
]

const COURSE_TYPES = [
  { value: 'self_paced', label: 'Belajar Mandiri', icon: 'fa-book-open' },
  { value: 'interactive', label: 'Interaktif', icon: 'fa-users' },
  { value: 'unsolved_case', label: 'Kasus Misterius', icon: 'fa-magnifying-glass' },
]

export default function CourseEditorPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const isNew = courseId === 'new'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('siswa')
  const [courseType, setCourseType] = useState('self_paced')
  const [image, setImage] = useState('')
  const [courseTitle, setCourseTitle] = useState('')

  const [videos, setVideos] = useState<CourseVideo[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [minigames, setMinigames] = useState<CourseMinigame[]>([])

  const [savingOrder, setSavingOrder] = useState(false)

  const orderedItems = useMemo(() => {
    const combined: OrderedSection[] = [
      ...videos.map((v) => ({ type: 'video' as const, id: v.id, title: v.title, urutan: v.urutan })),
      ...materials.map((m) => ({ type: 'materi' as const, id: m.id, title: m.title, urutan: m.urutan })),
      ...quizzes.map((q) => ({ type: 'quiz' as const, id: q.id, title: q.title, urutan: q.urutan })),
      ...minigames.map((g) => ({ type: 'minigame' as const, id: g.id, title: g.title, urutan: g.urutan })),
    ]
    combined.sort((a, b) => a.urutan - b.urutan)
    return combined
  }, [videos, materials, quizzes, minigames])

  const loadCourseData = useCallback(async (id: string) => {
    setLoading(true)
    const course = await getCourse(id).catch(() => null)
    if (!course) {
      router.push('/admin/courses')
      return
    }
    setTitle(course.title)
    setDescription(course.description || '')
    setCategory(course.category)
    setCourseType(course.type || 'self_paced')
    setImage(course.image || '')
    setCourseTitle(course.title)
    setEditMode(true)
    setLoading(false)

    getCourseVideos(id).then(setVideos).catch(() => {})
    getCourseMaterials(id).then(setMaterials).catch(() => {})
    getQuizzes(id).then(setQuizzes).catch(() => {})
    getCourseMinigames(id).then(setMinigames).catch(() => {})
  }, [router])

  useEffect(() => {
    if (isNew && !createdId) {
      setEditMode(false)
      setLoading(false)
      return
    }
    if (editMode) return
    if (!courseId) return
    loadCourseData(createdId || courseId)
  }, [courseId, isNew, createdId, editMode, loadCourseData])

  const handleSubmit = async (publish: boolean) => {
    if (saving) return
    if (!title.trim()) {
      setError('Judul course wajib diisi.')
      return
    }
    setError('')
    setSaving(true)
    try {
      const payload: Partial<Course> = {
        title: title.trim(),
        slug: title.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim(),
        category,
        type: courseType,
        image: image.trim() || undefined,
        is_published: publish,
      }

      if (isNew && !createdId) {
        const created = await createCourse(payload)
        const newId = String(created.id)
        setCreatedId(newId)
        window.history.replaceState({}, '', `/admin/course/${newId}`)
        setTitle(created.title || title)
        setDescription(created.description || description)
        setCategory(created.category || category)
        setCourseType(created.type || courseType)
        setImage(created.image || image)
        setCourseTitle(created.title || title)
        setEditMode(true)
        getCourseVideos(newId).then(setVideos).catch(() => {})
        getCourseMaterials(newId).then(setMaterials).catch(() => {})
        getQuizzes(newId).then(setQuizzes).catch(() => {})
        getCourseMinigames(newId).then(setMinigames).catch(() => {})
      } else {
        await updateCourse(getActiveId(), payload)
        setCourseTitle(title.trim())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan course')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm('Hapus item ini?')) return
    try {
      if (type === 'video') { await deleteCourseVideo(id); setVideos((prev) => prev.filter((v) => v.id !== id)) }
      else if (type === 'materi') { await deleteCourseMaterial(id); setMaterials((prev) => prev.filter((m) => m.id !== id)) }
      else if (type === 'quiz') { await deleteQuiz(id); setQuizzes((prev) => prev.filter((q) => q.id !== id)) }
      else if (type === 'minigame') { await deleteCourseMinigame(id); setMinigames((prev) => prev.filter((g) => g.id !== id)) }
    } catch {
      alert('Gagal menghapus item')
    }
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const newOrder = [...orderedItems]
    const target = index + direction
    if (target < 0 || target >= newOrder.length) return
    const temp = newOrder[index]
    newOrder[index] = newOrder[target]
    newOrder[target] = temp
    const newUrutan = newOrder.map((item, i) => ({ ...item, urutan: i }))

    const newVideos = newUrutan.filter((i) => i.type === 'video').map((i) => ({ ...videos.find((v) => v.id === i.id)!, urutan: i.urutan }))
    const newMaterials = newUrutan.filter((i) => i.type === 'materi').map((i) => ({ ...materials.find((m) => m.id === i.id)!, urutan: i.urutan }))
    const newQuizzes = newUrutan.filter((i) => i.type === 'quiz').map((i) => ({ ...quizzes.find((q) => q.id === i.id)!, urutan: i.urutan }))
    const newMinigames = newUrutan.filter((i) => i.type === 'minigame').map((i) => ({ ...minigames.find((g) => g.id === i.id)!, urutan: i.urutan }))

    setVideos(newVideos)
    setMaterials(newMaterials)
    setQuizzes(newQuizzes)
    setMinigames(newMinigames)
  }

  const getActiveId = () => createdId || courseId

  const handleSaveOrder = async () => {
    setSavingOrder(true)
    try {
      const id = getActiveId()
      const updates = orderedItems.map((item, i) => ({ ...item, urutan: i }))
      await saveSectionOrder(id, updates)
      const [vids, mats, quiz, mgs] = await Promise.all([
        getCourseVideos(id),
        getCourseMaterials(id),
        getQuizzes(id),
        getCourseMinigames(id),
      ])
      setVideos(vids)
      setMaterials(mats)
      setQuizzes(quiz)
      setMinigames(mgs)
    } catch {
      alert('Gagal menyimpan urutan')
    } finally {
      setSavingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-3xl text-[#005696]"></i>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {editMode ? 'Edit course' : 'Buat course'}
          </span>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">
            {editMode ? courseTitle : 'Course Baru'}
          </h1>
        </div>
        <button
          onClick={() => router.push('/admin/courses')}
          className="flex items-center gap-2 bg-[#005696] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#003d6e] transition-colors"
        >
          <i className="fas fa-arrow-left"></i> Kembali
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 mb-8">
        <h2 className="font-bold text-lg text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
          <i className="fas fa-info-circle text-[#005696]"></i> Informasi Course
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul Course</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masukkan judul course"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat course"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                  category === cat.value
                    ? 'border-[#005696] bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{cat.label}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.desc}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  category === cat.value ? 'border-[#005696]' : 'border-gray-300'
                }`}>
                  {category === cat.value && (
                    <div className="w-2 h-2 bg-[#005696] rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Course</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {COURSE_TYPES.map((ct) => (
              <div
                key={ct.value}
                onClick={() => setCourseType(ct.value)}
                className={`border-2 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
                  courseType === ct.value
                    ? 'border-[#005696] bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <i className={`fas ${ct.icon} text-lg ${courseType === ct.value ? 'text-[#005696]' : 'text-gray-400'}`}></i>
                <span className="font-semibold text-sm text-gray-800">{ct.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">URL Gambar</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <i className="fas fa-image absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/gambar.jpg"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
              />
            </div>
            {image && (
              <div className="shrink-0 w-14 h-14 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                <img
                  src={image}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {editMode && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 mb-8">
            <h2 className="font-bold text-lg text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
              <i className="fas fa-layer-group text-[#005696]"></i> Konten Course
            </h2>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <i className="fas fa-file-alt text-green-600"></i> Modul
              </h3>
              <div className="space-y-2">
                {materials.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Belum ada modul.</p>
                ) : (
                  [...materials]
                    .sort((a, b) => a.urutan - b.urutan)
                    .map((mod) => (
                      <div
                        key={mod.id}
                        className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3 hover:bg-green-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-green-200 text-xs font-bold text-green-700 flex items-center justify-center shrink-0">
                            {mod.urutan}
                          </span>
                          <span className="text-sm font-medium text-gray-700 truncate">{mod.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/admin/course/${getActiveId()}/module/${mod.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-white"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            onClick={() => handleDeleteItem('materi', mod.id)}
                            className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-white"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <Link
                href={`/admin/course/${getActiveId()}/module/new`}
                className="inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <i className="fas fa-plus"></i> Tambah Modul
              </Link>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <i className="fas fa-video text-blue-600"></i> Video
                </h3>
                <div className="space-y-2">
                  {videos.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Belum ada video.</p>
                  ) : (
                    [...videos]
                      .sort((a, b) => a.urutan - b.urutan)
                      .map((vid) => (
                        <div
                          key={vid.id}
                          className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 bg-white rounded border border-blue-100 text-blue-500">
                              <i className="fas fa-video text-xs"></i>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-700 truncate">{vid.title}</h4>
                              <p className="text-[10px] text-gray-400 truncate">{vid.video_url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/admin/course/${getActiveId()}/video/${vid.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-white"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              onClick={() => handleDeleteItem('video', vid.id)}
                              className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-white"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                <Link
                  href={`/admin/course/${getActiveId()}/video/new`}
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-plus"></i> Tambah Video
                </Link>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                  <i className="fas fa-question-circle text-purple-600"></i> Quiz
                </h3>
                <div className="space-y-2">
                  {quizzes.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Belum ada quiz.</p>
                  ) : (
                    [...quizzes]
                      .sort((a, b) => a.urutan - b.urutan)
                      .map((quiz) => (
                        <div
                          key={quiz.id}
                          className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 hover:bg-purple-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-1.5 bg-white rounded border border-purple-100 text-purple-500">
                              <i className="fas fa-question-circle text-xs"></i>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-gray-700 truncate">{quiz.title}</h4>
                              <p className="text-[10px] text-gray-400 truncate">{quiz.description || 'Tidak ada deskripsi'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/admin/course/${getActiveId()}/quiz/${quiz.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-white"
                            >
                              <i className="fas fa-edit"></i>
                            </Link>
                            <button
                              onClick={() => handleDeleteItem('quiz', quiz.id)}
                              className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-white"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                <Link
                  href={`/admin/course/${getActiveId()}/quiz/new`}
                  className="inline-flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <i className="fas fa-plus"></i> Tambah Quiz
                </Link>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <i className="fas fa-gamepad text-orange-600"></i> Minigame
              </h3>
              <div className="space-y-2">
                {minigames.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Belum ada minigame.</p>
                ) : (
                  [...minigames]
                    .sort((a, b) => a.urutan - b.urutan)
                    .map((mg) => (
                      <div
                        key={mg.id}
                        className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 hover:bg-orange-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 bg-white rounded border border-orange-100 text-orange-500">
                            <i className="fas fa-gamepad text-xs"></i>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-gray-700 truncate">{mg.title}</h4>
                            <p className="text-[10px] text-gray-400 truncate capitalize">{mg.type.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/admin/course/${getActiveId()}/minigame/${mg.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-white"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            onClick={() => handleDeleteItem('minigame', mg.id)}
                            className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-white"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
              <Link
                href={`/admin/course/${getActiveId()}/minigame/new`}
                className="inline-flex items-center gap-1.5 bg-orange-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <i className="fas fa-plus"></i> Tambah Minigame
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <i className="fas fa-sort text-[#005696]"></i> Urutan Konten
              </h2>
              <button
                type="button"
                onClick={handleSaveOrder}
                disabled={savingOrder}
                className="flex items-center gap-1.5 bg-[#005696] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#003d6e] transition-colors disabled:opacity-50"
              >
                {savingOrder ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-save"></i>
                )}
                Simpan Urutan
              </button>
            </div>
            <p className="text-xs text-gray-400">Gunakan tombol panah untuk mengatur urutan konten.</p>

            {orderedItems.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-6">Belum ada konten.</p>
            ) : (
              <div className="space-y-1.5">
                {orderedItems.map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#fbbf24] text-[10px] font-bold text-gray-800 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase shrink-0 ${
                      item.type === 'video' ? 'text-blue-600' :
                      item.type === 'materi' ? 'text-green-600' :
                      item.type === 'quiz' ? 'text-purple-600' :
                      'text-orange-600'
                    }`}>
                      {item.type === 'video' ? 'Video' :
                       item.type === 'materi' ? 'Materi' :
                       item.type === 'quiz' ? 'Quiz' :
                       'Game'}
                    </span>
                    <span className="text-sm text-gray-700 truncate flex-1">{item.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="p-1 bg-[#005696] text-white rounded hover:bg-[#003d6e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Naik"
                      >
                        <i className="fas fa-chevron-up text-xs"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, 1)}
                        disabled={index === orderedItems.length - 1}
                        className="p-1 bg-[#005696] text-white rounded hover:bg-[#003d6e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Turun"
                      >
                        <i className="fas fa-chevron-down text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-center gap-4 pt-4 pb-8">
        {!editMode ? (
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="px-10 py-3 bg-[#005696] text-white font-bold rounded-xl hover:bg-[#003d6e] flex items-center gap-2 shadow-md transition-all text-sm disabled:opacity-50"
          >
            {saving ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-arrow-right"></i>
            )}
            {saving ? 'Menyimpan...' : 'Selanjutnya'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="px-8 py-3 bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 flex items-center gap-2 shadow-md transition-all text-sm disabled:opacity-50"
            >
              {saving ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-save"></i>
              )}
              {saving ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="px-8 py-3 bg-[#005696] text-white font-bold rounded-xl hover:bg-[#003d6e] flex items-center gap-2 shadow-md transition-all text-sm disabled:opacity-50"
            >
              {saving ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-check-circle"></i>
              )}
              {saving ? 'Menyimpan...' : 'Publikasikan'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
