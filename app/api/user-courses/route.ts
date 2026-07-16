import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSiswaSession } from '@/services/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('user_courses')
    .select('*, courses(*)')
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const { user_id, course_id } = await request.json()

  if (!user_id || !course_id) {
    return NextResponse.json({ error: 'user_id dan course_id required' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from('user_courses')
    .select('*')
    .eq('user_id', user_id)
    .eq('course_id', course_id)
    .maybeSingle()

  if (existing) return NextResponse.json(existing)

  const { data, error } = await supabase
    .from('user_courses')
    .insert({ user_id, course_id, current_urutan: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
