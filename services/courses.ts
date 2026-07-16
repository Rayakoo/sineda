import { getSupabase, getAccessToken, apiFetch } from '@/lib/supabaseClient'
import type { Course, CourseVideo, CourseMaterial, Category, CourseMinigame, Quiz, OrderedSection } from '@/types/course'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const headers = (token?: string) => ({
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

async function authHeaders() {
  const token = await getAccessToken().catch(() => undefined)
  return headers(token)
}

// Courses
export async function getPublishedCourses(): Promise<Course[]> {
  const { data } = await getSupabase()
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  return data || []
}

export async function getAllCourses(): Promise<Course[]> {
  const h = await authHeaders()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*&order=sort_order.asc`, { headers: h })
  if (!res.ok) return []
  return res.json()
}

const courseCache = new Map<string, Course>()

export function getCachedCourse(id: string): Course | null | undefined {
  const key = String(id)
  return courseCache.has(key) ? courseCache.get(key)! : undefined
}

export async function getCourse(id: string | number, force = false): Promise<Course | null> {
  const key = String(id)
  if (!force && courseCache.has(key)) return courseCache.get(key)!

  const numericId = Number(id)
  const h = await authHeaders()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=*&id=eq.${numericId}`, {
    headers: { ...h, Accept: 'application/vnd.pgrst.object+json' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as Course | null
  if (data) courseCache.set(key, data)
  return data
}

export async function createCourse(input: Partial<Course>): Promise<Course> {
  return apiFetch(`${SUPABASE_URL}/rest/v1/courses?select=*`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'return=representation' },
    body: JSON.stringify(input),
  })
}

export async function updateCourse(id: string, input: Partial<Course>): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), Prefer: 'return=minimal' },
    body: JSON.stringify({ ...input, updated_at: new Date().toISOString() }),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Gagal mengupdate course (${res.status})`)
  }
}

export async function deleteCourse(id: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?id=eq.${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `Gagal menghapus course (${res.status})`)
  }
}

// Course Videos
export async function getCourseVideos(courseId: string): Promise<CourseVideo[]> {
  const { data } = await getSupabase()
    .from('course_videos')
    .select('*')
    .eq('course_id', courseId)
    .order('urutan')
  return data || []
}

export async function createCourseVideo(input: Partial<CourseVideo>): Promise<CourseVideo> {
  return apiFetch(`${SUPABASE_URL}/rest/v1/course_videos?select=*`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'return=representation' },
    body: JSON.stringify(input),
  })
}

export async function updateCourseVideo(id: string, input: Partial<CourseVideo>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/course_videos?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), Prefer: 'return=minimal' },
    body: JSON.stringify(input),
  })
}

export async function deleteCourseVideo(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/course_videos?id=eq.${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
}

// Course Materials
export async function getCourseMaterials(courseId: string): Promise<CourseMaterial[]> {
  const { data } = await getSupabase()
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('urutan')
  return data || []
}

export async function createCourseMaterial(input: Partial<CourseMaterial>): Promise<CourseMaterial> {
  return apiFetch(`${SUPABASE_URL}/rest/v1/course_materials?select=*`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'return=representation' },
    body: JSON.stringify(input),
  })
}

export async function updateCourseMaterial(id: string, input: Partial<CourseMaterial>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/course_materials?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), Prefer: 'return=minimal' },
    body: JSON.stringify(input),
  })
}

export async function deleteCourseMaterial(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/course_materials?id=eq.${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
}

// Sections (combined ordered list)
export async function getCourseSections(courseId: string): Promise<OrderedSection[]> {
  const [videos, materials, quizzes, minigames] = await Promise.all([
    getCourseVideos(courseId),
    getCourseMaterials(courseId),
    getQuizzes(courseId),
    getCourseMinigames(courseId),
  ])
  const combined: OrderedSection[] = [
    ...videos.map((v) => ({ type: 'video' as const, id: v.id, title: v.title, urutan: v.urutan })),
    ...materials.map((m) => ({ type: 'materi' as const, id: m.id, title: m.title, urutan: m.urutan })),
    ...quizzes.map((q) => ({ type: 'quiz' as const, id: q.id, title: q.title, urutan: q.urutan })),
    ...minigames.map((g) => ({ type: 'minigame' as const, id: g.id, title: g.title, urutan: g.urutan })),
  ]
  combined.sort((a, b) => a.urutan - b.urutan)
  return combined
}

export async function saveSectionOrder(courseId: string, sections: OrderedSection[]): Promise<void> {
  const h = await authHeaders()
  await Promise.all(
    sections.map((s) => {
      const table =
        s.type === 'video' ? 'course_videos' :
        s.type === 'materi' ? 'course_materials' :
        s.type === 'quiz' ? 'quizzes' : 'course_minigames'
      return fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${s.id}`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ urutan: s.urutan }),
      })
    })
  )
}

// Quizzes
export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const { data } = await getSupabase()
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()
  return data
}

export async function getQuizzes(courseId: string): Promise<Quiz[]> {
  const { data } = await getSupabase()
    .from('quizzes')
    .select('*')
    .eq('course_id', courseId)
    .order('urutan')
  return data || []
}

export async function getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: import('@/types/course').QuizQuestion[] } | null> {
  const { data: quiz } = await getSupabase().from('quizzes').select('*').eq('id', quizId).single()
  if (!quiz) return null
  const { data: questions } = await getSupabase()
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('urutan')
  return { quiz, questions: questions || [] }
}

export async function createQuiz(input: Partial<Quiz>): Promise<Quiz> {
  return apiFetch(`${SUPABASE_URL}/rest/v1/quizzes?select=*`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'return=representation' },
    body: JSON.stringify(input),
  })
}

export async function updateQuiz(id: string, input: Partial<Quiz>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/quizzes?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), Prefer: 'return=minimal' },
    body: JSON.stringify(input),
  })
}

export async function deleteQuiz(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/quizzes?id=eq.${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
}

// Quiz Questions
export async function getQuizQuestions(quizId: string): Promise<import('@/types/course').QuizQuestion[]> {
  const { data } = await getSupabase()
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('urutan')
  return data || []
}

export async function createQuizQuestion(input: Partial<import('@/types/course').QuizQuestion>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/quiz_questions`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'return=minimal' },
    body: JSON.stringify(input),
  })
}

export async function updateQuizQuestion(id: string, input: Partial<import('@/types/course').QuizQuestion>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/quiz_questions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeaders()), Prefer: 'return=minimal' },
    body: JSON.stringify(input),
  })
}

export async function deleteQuizQuestion(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/quiz_questions?id=eq.${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
}

// Course Minigames
export async function getCourseMinigames(courseId: string): Promise<CourseMinigame[]> {
  const { data } = await getSupabase()
    .from('course_minigames')
    .select('*')
    .eq('course_id', courseId)
    .order('urutan')
  return data || []
}

export async function createCourseMinigame(input: Partial<CourseMinigame>): Promise<CourseMinigame> {
  return apiFetch(`${SUPABASE_URL}/rest/v1/course_minigames?select=*`, {
    method: 'POST',
    headers: { ...(await authHeaders()), Prefer: 'return=representation' },
    body: JSON.stringify(input),
  })
}

export async function deleteCourseMinigame(id: string): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/course_minigames?id=eq.${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
}

// Stats for admin
export async function getCourseStats() {
  const courses = await getAllCourses()
  const total = courses.length
  const published = courses.filter((c) => c.is_published).length
  const byCategory: Record<string, number> = {}
  courses.forEach((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1
  })
  return { total, published, draft: total - published, byCategory }
}

export async function getNextUrutan(courseId: number): Promise<number> {
  const { data } = await getSupabase()
    .from('course_videos')
    .select('urutan')
    .eq('course_id', courseId)
    .order('urutan', { ascending: false })
    .limit(1)
  const rows = data as { urutan: number }[] | null
  return (rows?.[0]?.urutan || 0) + 1
}

export async function getNextGlobalUrutanAndIncrement(courseId: string): Promise<number> {
  const tables = ['course_videos', 'course_materials', 'quizzes', 'course_minigames'] as const
  let maxUrutan = 0
  for (const table of tables) {
      const { data } = await getSupabase()
      .from(table)
      .select('urutan')
      .eq('course_id', courseId)
      .order('urutan', { ascending: false })
      .limit(1)
    const rows = data as { urutan: number }[] | null
    if (rows && rows[0]?.urutan > maxUrutan) {
      maxUrutan = rows[0].urutan
    }
  }
  return maxUrutan + 1
}
