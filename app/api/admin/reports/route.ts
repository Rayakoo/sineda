import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  const [profilesRes, siswaRes, enrollmentsRes, resultsRes, coursesRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, created_at').neq('role', 'admin'),
    supabase.from('siswa_intervensi').select('id, name, created_at'),
    supabase.from('user_courses').select('*, courses(title)'),
    supabase.from('user_quiz_results').select('*, quizzes(title, courses(title))'),
    supabase.from('courses').select('id, title, lessons'),
  ])

  const profiles = profilesRes.data || []
  const siswaList = siswaRes.data || []
  const enrollments = enrollmentsRes.data || []
  const quizResults = resultsRes.data || []
  const courses = coursesRes.data || []
  const courseMap: Record<number, { title: string; lessons: number }> = {}
  for (const c of courses) {
    courseMap[c.id] = { title: c.title, lessons: c.lessons || 0 }
  }

  const enrollmentMap: Record<string, any[]> = {}
  for (const e of enrollments) {
    if (!enrollmentMap[e.user_id]) enrollmentMap[e.user_id] = []
    enrollmentMap[e.user_id].push(e)
  }

  const quizMap: Record<string, any[]> = {}
  for (const r of quizResults) {
    if (!quizMap[r.user_id]) quizMap[r.user_id] = []
    quizMap[r.user_id].push(r)
  }

  function mapEnrollments(userId: string) {
    return (enrollmentMap[userId] || []).map((e) => {
      const courseInfo = courseMap[e.course_id] || { title: 'Unknown', lessons: 0 }
      return {
        course_id: e.course_id,
        course_title: courseInfo.title,
        course_lessons: courseInfo.lessons,
        current_urutan: e.current_urutan,
        is_completed: e.is_completed,
        completed_at: e.completed_at,
      }
    })
  }

  function mapQuizResults(userId: string) {
    return (quizMap[userId] || []).map((r) => {
      const quizData = r.quizzes as { title: string; courses: { title: string } | null } | null
      return {
        quiz_id: r.quiz_id,
        quiz_title: quizData?.title || 'Unknown',
        course_title: quizData?.courses?.title || '',
        score: r.score,
        total: r.total,
        passed: r.passed,
        created_at: r.created_at,
      }
    })
  }

  const users = [
    ...profiles.map((p) => ({
      id: p.id,
      name: p.full_name || 'Tanpa Nama',
      type: 'auth' as const,
      created_at: p.created_at,
      enrollments: mapEnrollments(p.id),
      quizResults: mapQuizResults(p.id),
    })),
    ...siswaList.map((s) => ({
      id: s.id,
      name: s.name,
      type: 'siswa_intervensi' as const,
      created_at: s.created_at,
      enrollments: mapEnrollments(s.id),
      quizResults: mapQuizResults(s.id),
    })),
  ]

  return NextResponse.json({ users, courses })
}
