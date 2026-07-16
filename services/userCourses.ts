import { getSupabase } from '@/lib/supabaseClient'
import type { UserCourse, UserQuizResult } from '@/types/course'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  return res.json()
}

export async function enrollCourse(userId: string, courseId: string): Promise<UserCourse> {
  return apiFetch<UserCourse>('/api/user-courses', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, course_id: courseId }),
  })
}

export async function getUserCourse(userId: string, courseId: string): Promise<UserCourse | null> {
  const courses = await apiFetch<UserCourse[]>(`/api/user-courses?user_id=${userId}`)
  return courses.find((c) => c.course_id === courseId) || null
}

export async function getUserCourses(userId: string): Promise<(UserCourse & { courses: import('@/types/course').Course })[]> {
  return apiFetch(`/api/user-courses?user_id=${userId}`)
}

export async function updateProgress(userId: string, courseId: string, urutan: number): Promise<void> {
  await apiFetch(`/api/user-courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ user_id: userId, current_urutan: urutan }),
  })
}

export async function completeCourse(userId: string, courseId: string): Promise<void> {
  await apiFetch(`/api/user-courses/${courseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ user_id: userId, is_completed: true, completed_at: new Date().toISOString() }),
  })
}

export async function getUserQuizResults(userId: string, quizId: string): Promise<UserQuizResult[]> {
  const all = await apiFetch<UserQuizResult[]>(`/api/quiz-results?user_id=${userId}`)
  return all.filter((r) => r.quiz_id === quizId)
}

export async function upsertQuizResult(input: { user_id: string; quiz_id: string; score: number; total: number; passed: boolean }): Promise<void> {
  await apiFetch('/api/quiz-results', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function areAllQuizzesPassed(courseId: string, userId: string): Promise<boolean> {
  const { data: quizzes } = await getSupabase()
    .from('quizzes')
    .select('id')
    .eq('course_id', courseId)
  const quizRows = quizzes as { id: string }[] | null
  if (!quizRows || quizRows.length === 0) return false
  const results = await apiFetch<UserQuizResult[]>(`/api/quiz-results?user_id=${userId}`)
  const passedQuizIds = new Set(results.filter((r) => r.passed).map((r) => r.quiz_id))
  return quizRows.every((q) => passedQuizIds.has(q.id))
}
