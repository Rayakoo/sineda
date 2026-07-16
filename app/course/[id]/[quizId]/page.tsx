'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getQuiz, getQuizQuestions } from '@/services/courses'
import { upsertQuizResult } from '@/services/userCourses'
import { useAuth } from '@/contexts/AuthContext'
import type { Quiz, QuizQuestion } from '@/types/course'

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getQuiz(params.quizId as string).then(setQuiz)
    getQuizQuestions(params.quizId as string).then((q) => {
      setQuestions(q.sort((a, b) => a.urutan - b.urutan))
      setLoading(false)
    })
  }, [params.quizId])

  const q = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  const handleAnswer = (value: string) => {
    if (!q) return
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
  }

  const handleNext = () => {
    if (isLast) handleSubmit()
    else setCurrentIndex((i) => i + 1)
  }

  const handleSubmit = async () => {
    if (!user || !quiz) return
    setSubmitting(true)
    let correct = 0
    questions.forEach((question) => {
      if (answers[question.id] === question.correct_answer) correct++
    })
    const score = Math.round((correct / questions.length) * 100)
    await upsertQuizResult({ user_id: user.id, quiz_id: quiz.id, score, total: questions.length, passed: score >= 70 })
    router.push(`/course/${params.id}/${quiz.id}/hasil?score=${score}&total=${questions.length}`)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center py-32"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div></div>

  if (!questions.length) return <div className="flex-1 text-center py-32 text-gray-400">Quiz belum memiliki soal</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{quiz?.title || 'Quiz'}</h1>
          {quiz?.description && <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>}
          <div className="flex items-center justify-center gap-2 mt-4">
            {questions.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i === currentIndex ? 'bg-[#005696] scale-125' : answers[questions[i].id] ? 'bg-green-400' : 'bg-gray-300'}`}></div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">{currentIndex + 1} dari {questions.length}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
          <p className="text-lg font-semibold text-gray-800 mb-4">{q.question_text}</p>
          <div className="space-y-3">
            {(q.options as string[]).filter(Boolean).map((opt, i) => (
              <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${answers[q.id] === opt ? 'border-[#005696] bg-blue-50' : 'hover:border-gray-300'}`}>
                <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => handleAnswer(opt)} className="accent-[#005696]" />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition font-medium">
            Sebelumnya
          </button>
          <button onClick={handleNext} disabled={!answers[q.id] || submitting}
            className="flex-1 px-6 py-3 rounded-xl bg-[#005696] text-white font-bold hover:bg-[#003d6e] disabled:opacity-50 transition">
            {submitting ? 'Mengirim...' : isLast ? 'Selesai' : 'Selanjutnya'}
          </button>
        </div>
      </div>
    </div>
  )
}
