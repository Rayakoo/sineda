import { getSupabase, getAccessToken } from '@/lib/supabaseClient'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function authHeaders() {
  const token = await getAccessToken().catch(() => null)
  return {
    'Content-Type': 'application/json' as const,
    apikey: SUPABASE_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export type CourseMinigame = {
  id: string
  course_id: string
  title: string
  type: MinigameType
  urutan: number
  created_at: string
  settings: Record<string, unknown>
}

export type MinigameType = "tts" | "find_the_word" | "true_or_false" | "drawing" | "fill_the_blank" | "match_pairs"

export const MINIGAME_TYPE_LABELS: Record<MinigameType, string> = {
  tts: "Teka Teki Silang",
  find_the_word: "Find the Word",
  true_or_false: "Benar atau Salah",
  drawing: "Menggambar",
  fill_the_blank: "Mengisi Kotak Kosong",
  match_pairs: "Memasangkan Gambar",
}

export const MINIGAME_TYPE_ICONS: Record<MinigameType, string> = {
  tts: "fa-puzzle-piece",
  find_the_word: "fa-search",
  true_or_false: "fa-check-double",
  drawing: "fa-paint-brush",
  fill_the_blank: "fa-pen",
  match_pairs: "fa-link",
}

export type TtsClue = {
  id: string
  minigame_id: string
  number: number
  question: string
  answer: string
  row: number
  col: number
  direction: "across" | "down"
  explanation: string | null
}

export type FindWord = {
  id: string
  minigame_id: string
  question: string
  answer: string
  explanation: string | null
  row: number
  col: number
  direction: "across" | "down"
}

export type TrueFalseItem = {
  image_url?: string
  title: string
  answer: boolean
  explanation?: string
}

export type TrueFalse = {
  id: string
  minigame_id: string
  question: string
  items: TrueFalseItem[]
}

export type Drawing = {
  id: string
  minigame_id: string
  question: string
  base_image_url: string | null
}

export type FillBlank = {
  id: string
  minigame_id: string
  image_url: string | null
  question: string
  answer_count: number
  answers: string[]
  explanation: string | null
}

export type MatchPairItem = {
  id: string
  match_pairs_id: string
  pair_code: string
  image_url: string | null
  card_title: string
}

export type MatchPairs = {
  id: string
  minigame_id: string
  question: string
  pair_count: number
  items: MatchPairItem[]
}

export async function getMinigameById(id: string) {
  const { data, error } = await getSupabase()
    .from("course_minigames")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw error
  return data as CourseMinigame
}

export async function createCourseMinigame(input: {
  course_id: string
  title: string
  type: MinigameType
  urutan?: number
}) {
  const h = await authHeaders()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/course_minigames?select=*`,
    {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify(input),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Supabase POST failed: ${res.status} ${errText}`)
  }
  const data = await res.json()
  if (!data || data.length === 0) throw new Error("No data returned")
  return data[0] as CourseMinigame
}

export async function updateCourseMinigame(
  id: string,
  updates: Partial<Pick<CourseMinigame, "title" | "type" | "urutan" | "settings">>
) {
  const h = await authHeaders()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/course_minigames?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { ...h, Prefer: "return=minimal" },
      body: JSON.stringify(updates),
    }
  )
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Supabase PATCH failed: ${res.status} ${errText}`)
  }
}

export async function deleteCourseMinigame(id: string) {
  const h = await authHeaders()
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/course_minigames?id=eq.${id}`,
    {
      method: "DELETE",
      headers: h,
    }
  )
  if (!res.ok) throw new Error(`Supabase DELETE failed: ${res.status}`)
}

export async function getTtsClues(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_tts")
    .select("*")
    .eq("minigame_id", minigameId)
    .order("number", { ascending: true })
  if (error) throw error
  return data as TtsClue[]
}

export async function saveTtsClues(minigameId: string, clues: Omit<TtsClue, "id" | "minigame_id" | "created_at">[]) {
  const h = await authHeaders()

  const deleteRes = await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_tts?minigame_id=eq.${minigameId}`,
    { method: "DELETE", headers: h }
  )
  if (!deleteRes.ok) throw new Error(`Gagal hapus clues lama: ${deleteRes.status}`)

  if (clues.length === 0) return

  const insertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_tts?select=*`,
    {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify(clues.map((c) => ({ ...c, minigame_id: minigameId }))),
    }
  )
  if (!insertRes.ok) throw new Error(`Gagal insert clues: ${insertRes.status}`)
}

export async function getFindWords(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_find_word")
    .select("*")
    .eq("minigame_id", minigameId)
  if (error) throw error
  return (data || []).map((w: Record<string, unknown>) => ({
    ...w,
    row: w.row ?? 0,
    col: w.col ?? 0,
    direction: (w.direction as "across" | "down") || "across",
  })) as FindWord[]
}

export async function getTrueFalseItems(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_true_false")
    .select("*")
    .eq("minigame_id", minigameId)
    .order("id", { ascending: true })
  if (error) throw error
  return data as TrueFalse[]
}

export async function saveTrueFalseItems(minigameId: string, data: { question: string; items: TrueFalseItem[] }) {
  const h = await authHeaders()
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_true_false?minigame_id=eq.${minigameId}`,
    { method: "DELETE", headers: h }
  )
  if (data.items.length === 0) return
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_true_false?select=*`,
    {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify({
        minigame_id: minigameId,
        question: data.question,
        items: JSON.stringify(data.items),
      }),
    }
  )
}

export async function getDrawings(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_drawing")
    .select("*")
    .eq("minigame_id", minigameId)
  if (error) throw error
  return data as Drawing[]
}

export async function saveDrawings(minigameId: string, items: Omit<Drawing, "id" | "minigame_id" | "created_at">[]) {
  const h = await authHeaders()
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_drawing?minigame_id=eq.${minigameId}`,
    { method: "DELETE", headers: h }
  )
  if (items.length === 0) return
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_drawing?select=*`,
    {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify(items.map((c) => ({ ...c, minigame_id: minigameId }))),
    }
  )
}

export async function getFillBlanks(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_fill_blank")
    .select("*")
    .eq("minigame_id", minigameId)
  if (error) throw error
  return data as FillBlank[]
}

export async function saveFillBlanks(minigameId: string, items: Omit<FillBlank, "id" | "minigame_id" | "created_at">[]) {
  const h = await authHeaders()
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_fill_blank?minigame_id=eq.${minigameId}`,
    { method: "DELETE", headers: h }
  )
  if (items.length === 0) return
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_fill_blank?select=*`,
    {
      method: "POST",
      headers: { ...h, Prefer: "return=representation" },
      body: JSON.stringify(items.map((c) => ({ ...c, minigame_id: minigameId, answers: JSON.stringify(c.answers) }))),
    }
  )
}

export async function getMatchPairs(minigameId: string) {
  const { data, error } = await getSupabase()
    .from("minigame_match_pairs")
    .select("*, items:minigame_match_pair_items(*)")
    .eq("minigame_id", minigameId)
  if (error) throw error
  return data as MatchPairs[]
}

export async function saveMatchPairs(
  minigameId: string,
  pairs: { question: string; pair_count: number; items: Omit<MatchPairItem, "id" | "match_pairs_id" | "created_at">[] }[]
) {
  const h = await authHeaders()

  const { data: existingPairs } = await getSupabase()
    .from("minigame_match_pairs")
    .select("id")
    .eq("minigame_id", minigameId)
  const ids = (existingPairs as { id: string }[] | null)?.map((p) => p.id) ?? []
  for (const pid of ids) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/minigame_match_pair_items?match_pairs_id=eq.${pid}`,
      { method: "DELETE", headers: h }
    )
  }
  await fetch(
    `${SUPABASE_URL}/rest/v1/minigame_match_pairs?minigame_id=eq.${minigameId}`,
    { method: "DELETE", headers: h }
  )

  if (pairs.length === 0) return

  for (const pair of pairs) {
    const pairRes = await fetch(
      `${SUPABASE_URL}/rest/v1/minigame_match_pairs?select=*`,
      {
        method: "POST",
        headers: { ...h, Prefer: "return=representation" },
        body: JSON.stringify({ minigame_id: minigameId, question: pair.question, pair_count: pair.pair_count }),
      }
    )
    if (!pairRes.ok) throw new Error(`Gagal insert match pair: ${pairRes.status}`)
    const [created] = await pairRes.json()
    if (!created) throw new Error("No data returned")

    if (pair.items.length > 0) {
      const itemRes = await fetch(
        `${SUPABASE_URL}/rest/v1/minigame_match_pair_items?select=*`,
        {
          method: "POST",
          headers: { ...h, Prefer: "return=representation" },
          body: JSON.stringify(pair.items.map((item) => ({ ...item, match_pairs_id: created.id }))),
        }
      )
      if (!itemRes.ok) throw new Error(`Gagal insert match pair items: ${itemRes.status}`)
    }
  }
}
