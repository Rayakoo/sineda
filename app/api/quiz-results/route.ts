import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('user_quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])

}

export async function POST(request: Request) {
  const body = await request.json()
  const { user_id, quiz_id, score, total, passed } = body

  if (!user_id || !quiz_id) {
    return NextResponse.json({ error: 'user_id dan quiz_id required' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: existing } = await supabase
    .from('user_quiz_results')
    .select('*')
    .eq('user_id', user_id)
    .eq('quiz_id', quiz_id)
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (existing) {
    await supabase
      .from('user_quiz_results')
      .update({ score, total, passed })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_quiz_results')
      .insert({ user_id, quiz_id, score, total, passed })
  }

  return NextResponse.json({ success: true })
}
