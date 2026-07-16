import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const published = searchParams.get('published')

  const supabase = await createClient()

  let query = supabase.from('courses').select('*').order('sort_order', { ascending: true })

  if (category && category !== 'Semua') {
    query = query.eq('category', category.toLowerCase())
  }
  if (published === 'true') {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('courses')
    .insert({ ...body, slug: body.slug || body.title.toLowerCase().replace(/\s+/g, '-') })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
