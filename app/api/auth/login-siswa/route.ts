import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let { name, kode } = await request.json()
  name = name.trim()
  kode = kode.trim()

  if (!name || !kode) {
    return NextResponse.json({ error: 'Nama dan kode password harus diisi' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('siswa_intervensi')
    .select('id, name')
    .ilike('name', name)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Nama tidak ditemukan' }, { status: 401 })
  }

  const { data: verifyData, error: verifyError } = await supabase
    .rpc('verify_siswa_password', { p_name: data.name, p_kode: kode })

  if (verifyError || !verifyData) {
    return NextResponse.json({ error: 'Kode password salah' }, { status: 401 })
  }

  return NextResponse.json({
    user: { id: data.id, name: data.name, role: 'siswa_intervensi' },
  })
}
