import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()

  const [profilesRes, siswaRes, enrollmentsRes, resultsRes, coursesRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, created_at').neq('role', 'admin'),
    supabase.from('siswa_intervensi').select('id, name, created_at'),
    supabase.from('user_courses').select('*, courses(title)'),
    supabase.from('user_quiz_results').select('*, quizzes(title)'),
    supabase.from('courses').select('id, title'),
  ])

  const profiles = profilesRes.data || []
  const siswaList = siswaRes.data || []
  const enrollments = enrollmentsRes.data || []
  const quizResults = resultsRes.data || []
  const courses = coursesRes.data || []

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

  const users = [
    ...profiles.map((p) => ({
      id: p.id,
      name: p.full_name || 'Tanpa Nama',
      type: 'auth' as const,
      created_at: p.created_at,
      enrollments: (enrollmentMap[p.id] || []).map((e) => ({
        course_id: e.course_id,
        course_title: (e.courses as { title: string } | null)?.title || 'Unknown',
        current_urutan: e.current_urutan,
        is_completed: e.is_completed,
        completed_at: e.completed_at,
      })),
      quizResults: (quizMap[p.id] || []).map((r) => ({
        quiz_id: r.quiz_id,
        quiz_title: (r.quizzes as { title: string } | null)?.title || 'Unknown',
        score: r.score,
        total: r.total,
        passed: r.passed,
        created_at: r.created_at,
      })),
    })),
    ...siswaList.map((s) => ({
      id: s.id,
      name: s.name,
      type: 'siswa_intervensi' as const,
      created_at: s.created_at,
      enrollments: (enrollmentMap[s.id] || []).map((e) => ({
        course_id: e.course_id,
        course_title: (e.courses as { title: string } | null)?.title || 'Unknown',
        current_urutan: e.current_urutan,
        is_completed: e.is_completed,
        completed_at: e.completed_at,
      })),
      quizResults: (quizMap[s.id] || []).map((r) => ({
        quiz_id: r.quiz_id,
        quiz_title: (r.quizzes as { title: string } | null)?.title || 'Unknown',
        score: r.score,
        total: r.total,
        passed: r.passed,
        created_at: r.created_at,
      })),
    })),
  ]

  return NextResponse.json({ users, courses })
}
