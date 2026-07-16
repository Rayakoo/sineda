'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { getCourse, getCachedCourse, getCourseVideos, getCourseMaterials, getQuizzes, getCourseMinigames } from '@/services/courses'
import { enrollCourse, updateProgress } from '@/services/userCourses'
import { getProxiedUrl } from '@/services/garage'
import { transformImageUrl } from '@/lib/image'
import { useAuth } from '@/contexts/AuthContext'
import type { Course, CourseVideo, CourseMaterial, Quiz, CourseMinigame, OrderedSection } from '@/types/course'

function getVideoEmbedUrl(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : url
  }
  return url
}

const sectionIcon = (type: string) => {
  switch (type) {
    case 'video': return 'fa-video text-blue-500'
    case 'materi': return 'fa-file-alt text-green-500'
    case 'quiz': return 'fa-question-circle text-purple-500'
    case 'minigame': return 'fa-gamepad text-orange-500'
    default: return 'fa-circle'
  }
}

export default function MateriPage() {
  const params = useParams()
  const courseId = params.id as string
  const { user } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [videos, setVideos] = useState<CourseVideo[]>([])
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [minigames, setCourseMinigames] = useState<CourseMinigame[]>([])
  const [currentSection, setCurrentSection] = useState<OrderedSection | null>(null)
  const [loading, setLoading] = useState(true)

  const sections = useMemo(() => {
    const combined: OrderedSection[] = [
      ...videos.map((v) => ({ type: 'video' as const, id: v.id, title: v.title, urutan: v.urutan })),
      ...materials.map((m) => ({ type: 'materi' as const, id: m.id, title: m.title, urutan: m.urutan })),
      ...quizzes.map((q) => ({ type: 'quiz' as const, id: q.id, title: q.title, urutan: q.urutan })),
      ...minigames.map((g) => ({ type: 'minigame' as const, id: g.id, title: g.title, urutan: g.urutan })),
    ]
    combined.sort((a, b) => a.urutan - b.urutan)
    return combined
  }, [videos, materials, quizzes, minigames])

  useEffect(() => {
    let active = true
    const cachedCourse = getCachedCourse(courseId)
    Promise.all([
      cachedCourse ? Promise.resolve(cachedCourse) : getCourse(courseId),
      getCourseVideos(courseId), getCourseMaterials(courseId),
      getQuizzes(courseId), getCourseMinigames(courseId),
    ]).then(([c, v, m, q, g]) => {
      if (!active) return
      setCourse(c as any); setVideos(v); setMaterials(m); setQuizzes(q); setCourseMinigames(g)
      setLoading(false)
    })
    return () => { active = false }
  }, [courseId])

  useEffect(() => {
    if (sections.length > 0 && !currentSection) setCurrentSection(sections[0])
  }, [sections, currentSection])

  useEffect(() => {
    if (!user || !courseId) return
    enrollCourse(user.id, courseId)
  }, [user, courseId])

  useEffect(() => {
    if (!user || !courseId || !currentSection) return
    updateProgress(user.id, courseId, currentSection.urutan)
  }, [user, courseId, currentSection])

  if (loading) return <div className="flex-1 flex items-center justify-center py-32"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div></div>

  const requireAuth = course?.category === 'siswa'

  const content = (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link href={course ? `/course/${course.id}` : '/'} className="text-gray-500 hover:text-[#005696]">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <div>
            <h1 className="font-bold text-sm text-gray-800">{course?.title || 'Materi'}</h1>
            <p className="text-[11px] text-gray-400">{sections.length} bagian</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 p-6 lg:p-10 overflow-auto">
          {!currentSection ? (
            <div className="text-center py-20 text-gray-400">
              <i className="fas fa-arrow-left text-4xl mb-4 block"></i>
              <p>Pilih materi dari daftar di samping</p>
            </div>
          ) : currentSection.type === 'video' ? (
            (() => { const v = videos.find((x) => x.id === currentSection!.id); return v ? (
              <div><h2 className="text-xl font-bold text-gray-800 mb-4">{v.title}</h2><div className="aspect-video rounded-xl overflow-hidden bg-black shadow-lg"><iframe className="w-full h-full" src={getVideoEmbedUrl(v.video_url)} allowFullScreen></iframe></div></div>
            ) : null })()
          ) : currentSection.type === 'materi' ? (
            (() => { const m = materials.find((x) => x.id === currentSection!.id); return m ? (
              <div><h2 className="text-xl font-bold text-gray-800 mb-4">{m.title}</h2><div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: m.content }} />{m.file_url && (() => {
                const rawUrl = m.file_url
                const proxied = getProxiedUrl(rawUrl)
                const url = proxied || rawUrl
                const driveId = rawUrl.match(/\/file\/d\/([^/?#]+)/)?.[1]
                const isPdf = rawUrl.match(/\.pdf(\?|$)/i) || url.match(/\.pdf(\?|$)/i)
                if (driveId) {
                  return <iframe src={`https://drive.google.com/file/d/${driveId}/preview`} className="w-full h-[70vh] rounded-xl border border-gray-200 mt-4" title="File Preview" />
                }
                if (isPdf) {
                  return <iframe src={url} className="w-full h-[70vh] rounded-xl border border-gray-200 mt-4" title="File Preview" />
                }
                return <a href={url} target="_blank" className="inline-flex items-center gap-2 mt-4 bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium text-[#005696] hover:bg-gray-200"><i className="fas fa-download"></i> Download File</a>
              })()}</div>
            ) : null })()
          ) : currentSection.type === 'quiz' ? (
            (() => { const q = quizzes.find((x) => x.id === currentSection!.id); return q ? (
              <div className="text-center py-12"><i className="fas fa-question-circle text-6xl text-purple-300 mb-4"></i><h2 className="text-xl font-bold text-gray-800 mb-2">{q.title}</h2><p className="text-gray-500 mb-6">{q.description}</p><Link href={`/course/${courseId}/${q.id}`} className="inline-block bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition">Mulai Quiz</Link></div>
            ) : null })()
          ) : (
            (() => { const g = minigames.find((x) => x.id === currentSection!.id); return g ? (
              <div className="text-center py-12"><i className="fas fa-gamepad text-6xl text-orange-300 mb-4"></i><h2 className="text-xl font-bold text-gray-800 mb-2">{g.title}</h2><p className="text-gray-500 mb-6 capitalize">Tipe: {g.type.replace(/_/g, ' ')}</p><Link href={`/course/${courseId}/minigame/${g.id}`} className="inline-block bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition">Mainkan</Link></div>
            ) : null })()
          )}
        </div>

        <aside className="w-80 bg-white border-l shrink-0 overflow-y-auto hidden lg:block">
          <div className="p-4 border-b"><h3 className="font-bold text-sm text-gray-700">Daftar Materi</h3></div>
          <div className="p-2 space-y-1">
            {sections.map((s) => (
              <button key={`${s.type}-${s.id}`} onClick={() => setCurrentSection(s)}
                className={`w-full text-left p-3 rounded-lg text-sm transition flex items-center gap-3 ${currentSection?.id === s.id ? 'bg-blue-50 text-[#005696] font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                <i className={`fas ${sectionIcon(s.type)} w-5 text-center`}></i>
                <span className="flex-1 truncate">{s.title}</span>
                <span className="text-[10px] text-gray-400 capitalize">{s.type === 'materi' ? 'modul' : s.type}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )

  if (requireAuth) {
    return <AuthGuard>{content}</AuthGuard>
  }
  return content
}
