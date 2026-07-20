export type Category = { id: string; name: string; slug: string }

export type Course = {
  id: number
  title: string
  slug: string
  description: string
  category: string
  type: string
  lessons: number
  duration: string
  image: string
  color: string
  icon: string
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CourseVideo = {
  id: string
  course_id: string
  title: string
  video_url: string
  urutan: number
  created_at: string
}

export type CourseMaterial = {
  id: string
  course_id: string
  title: string
  content: string
  urutan: number
  file_url?: string
  created_at: string
}

export type Quiz = {
  id: string
  course_id: string
  title: string
  description: string
  urutan: number
  created_at: string
}

export type QuizQuestion = {
  id: string
  quiz_id: string
  question_text: string
  options: string[]
  correct_answer: string
  urutan: number
  image_url?: string
  created_at: string
}

export type UserCourse = {
  id: string
  user_id: string
  course_id: string
  current_urutan: number
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type UserQuizResult = {
  id: string
  user_id: string
  quiz_id: string
  score: number
  total: number
  passed: boolean
  created_at: string
}

export type CourseMinigame = {
  id: string
  course_id: string
  title: string
  type: 'tts' | 'find_the_word' | 'true_or_false' | 'drawing' | 'fill_the_blank' | 'match_pairs'
  urutan: number
  settings: Record<string, unknown>
  created_at: string
}

export type Profile = {
  id: string
  full_name: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export type OrderedSection = {
  type: 'video' | 'materi' | 'quiz' | 'minigame'
  id: string
  title: string
  urutan: number
}

export type UnsolvedCaseItem = {
  type: 'text' | 'image'
  content: string
}

export type UnsolvedCase = {
  id: string
  course_id: number
  title: string
  peraturan: UnsolvedCaseItem[]
  instruksi: UnsolvedCaseItem[]
  jawaban: UnsolvedCaseItem[]
  created_at: string
  updated_at: string
}

export type UserDetective = {
  id: string
  unsolved_case_id: string
  detective_name: string
  answers: Record<string, unknown>[]
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type UnsolvedCaseHintType = 'chat' | 'karakter' | 'buku' | 'kartu' | 'lainnya'

export type UnsolvedCaseHintChat = {
  is_chat: boolean
  nama_lawan_chat?: string
  judul_hint?: string
  images: string[]
}

export type UnsolvedCaseHintKarakter = {
  nama: string
  foto_karakter: string
  images: string[]
}

export type UnsolvedCaseHintBuku = {
  judul_buku: string
  cover_buku: string
  isi_buku: string[]
}

export type UnsolvedCaseHintKartu = {
  nama_kartu: string
  kartu_depan: string
  kartu_belakang: string
}

export type UnsolvedCaseHintLainnya = {
  nama_hint: string
  gambar: string
  jumlah: number
}

export type UnsolvedCaseHint = {
  id: string
  unsolved_case_id: string
  urutan: number
  tipe: UnsolvedCaseHintType
  konten: UnsolvedCaseHintChat | UnsolvedCaseHintKarakter | UnsolvedCaseHintBuku | UnsolvedCaseHintKartu | UnsolvedCaseHintLainnya
  created_at: string
  updated_at: string
}
