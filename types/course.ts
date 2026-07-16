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
