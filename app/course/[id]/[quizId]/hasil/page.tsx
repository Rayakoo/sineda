'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCourse, getCourseSections } from '@/services/courses'
import { useAuth } from '@/contexts/AuthContext'
import type { Course, OrderedSection } from '@/types/course'

const TYPE_LABEL: Record<string, string> = { video: 'Video', materi: 'Modul', quiz: 'Quiz', minigame: 'Mini Game' }
const TYPE_ICON: Record<string, string> = { video: 'fa-video', materi: 'fa-book-open', quiz: 'fa-question-circle', minigame: 'fa-gamepad' }

export default function QuizResultPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [nextSection, setNextSection] = useState<OrderedSection | null>(null)
  const [sections, setSections] = useState<OrderedSection[]>([])

  const score = Number(searchParams.get('score')) || 0
  const total = Number(searchParams.get('total')) || 0
  const correct = Number(searchParams.get('correct')) || 0
  const incorrect = total - correct
  const passed = score >= 75

  useEffect(() => {
    getCourse(params.id as string).then(setCourse)
    getCourseSections(params.id as string).then((secs) => {
      setSections(secs)
      const idx = secs.findIndex((s) => s.type === 'quiz' && s.id === params.quizId)
      if (idx !== -1 && idx < secs.length - 1) {
        setNextSection(secs[idx + 1])
      }
    })
  }, [params.id, params.quizId])

  const goNext = () => {
    if (!nextSection) return
    if (nextSection.type === 'quiz') {
      router.push(`/course/${params.id}/${nextSection.id}`)
    } else if (nextSection.type === 'minigame') {
      router.push(`/course/${params.id}/minigame/${nextSection.id}`)
    } else {
      router.push(`/course/${params.id}/materi?section=${nextSection.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          <i className={`fas ${passed ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'} text-5xl`}></i>
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? 'Selamat!' : 'Belum Lulus'}
        </h1>
        <p className="text-gray-500 mb-2">{passed ? 'Kamu berhasil menyelesaikan quiz dengan baik' : 'Coba lagi ya, semangat!'}</p>
        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <p className="text-sm text-gray-400 mb-1">Nilai Kamu</p>
          <p className="text-5xl font-bold text-gray-800">{score}<span className="text-2xl text-gray-400">/100</span></p>
          <p className="text-sm text-gray-400 mt-2">{total} soal</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm">
            <span className="text-green-600"><i className="fas fa-check mr-1"></i>{correct} benar</span>
            <span className="text-red-500"><i className="fas fa-times mr-1"></i>{incorrect} salah</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {passed ? (
            nextSection ? (
              <div className="flex flex-col items-center gap-2">
                <button onClick={goNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#005696] text-white font-bold hover:bg-[#003d6e] transition-all shadow-sm active:scale-95">
                  Lanjut ke {TYPE_LABEL[nextSection.type]} Selanjutnya
                  <i className="fas fa-arrow-right text-xs"></i>
                </button>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <i className={`fas ${TYPE_ICON[nextSection.type]} text-[10px]`}></i>
                  Selanjutnya: {nextSection.title}
                </p>
              </div>
            ) : (
              <Link href={`/course/${params.id}/materi?section=${params.quizId}`}
                className="px-6 py-3 rounded-xl bg-[#005696] text-white font-bold hover:bg-[#003d6e] transition">
                Kembali ke Materi
              </Link>
            )
          ) : (
            <Link href={`/course/${params.id}/${params.quizId}`}
              className="px-8 py-3 rounded-xl bg-[#F7941E] text-white font-bold hover:bg-[#e0861b] transition shadow-sm">
              Ulang Quiz
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
