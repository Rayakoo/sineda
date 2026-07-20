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
  const [locked, setLocked] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [slideKey, setSlideKey] = useState(0)
  const [slideInFrom, setSlideInFrom] = useState<'right' | 'left'>('right')

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

  const goNext = () => {
    if (!q) return
    setLocked((prev) => new Set(prev).add(q.id))
    if (isLast) { handleSubmit(); return }
    setTimeout(() => {
      setSlideInFrom('right')
      setSlideKey((k) => k + 1)
      setCurrentIndex((i) => i + 1)
    }, 700)
  }

  const goBack = () => {
    if (currentIndex === 0) return
    setSlideInFrom('left')
    setSlideKey((k) => k - 1)
    setCurrentIndex((i) => i - 1)
  }

  const handleSubmit = async () => {
    if (!user || !quiz) return
    setSubmitting(true)
    let correct = 0
    questions.forEach((question) => {
      if (answers[question.id] === question.correct_answer) correct++
    })
    const score = Math.round((correct / questions.length) * 100)
    await upsertQuizResult({ user_id: user.id, quiz_id: quiz.id, score, total: questions.length, passed: score >= 75 })
    router.push(`/course/${params.id}/${quiz.id}/hasil?score=${score}&total=${questions.length}&correct=${correct}`)
  }

  if (loading) return <div className="flex-1 flex items-center justify-center py-32"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#005696]"></div></div>

  if (!questions.length) return <div className="flex-1 text-center py-32 text-gray-400">Quiz belum memiliki soal</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes slide-from-right { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-from-left { from { opacity: 0; transform: translateX(-60px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.8); } 70% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(0,86,150,0.4); } 50% { box-shadow: 0 0 0 8px rgba(0,86,150,0); } }
        @keyframes bounce-dot { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .animate-bounce-dot { animation: bounce-dot 1s ease-in-out infinite; }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{quiz?.title || 'Quiz'}</h1>
          {quiz?.description && <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>}
          <div className="flex items-center justify-center gap-2 mt-4">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-[#005696] scale-125 animate-bounce-dot'
                    : answers[questions[i].id] && answers[questions[i].id] === questions[i].correct_answer
                      ? 'bg-green-500'
                      : answers[questions[i].id]
                        ? 'bg-red-400'
                        : 'bg-gray-300'
                }`}
              ></div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2">{currentIndex + 1} dari {questions.length}</p>
        </div>

        <div key={slideKey} style={{ animation: `slide-from-${slideInFrom} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards` }}>
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <p className="text-lg font-semibold text-gray-800 mb-4">{q.question_text}</p>
            <div className="space-y-3">
              {(q.options as string[]).filter(Boolean).map((opt, i) => {
                const isLocked = locked.has(q.id)
                const isSelected = answers[q.id] === opt
                const isCorrect = opt === q.correct_answer
                let optClass = 'hover:border-gray-300 hover:shadow-sm'
                if (isLocked) {
                  if (isCorrect) optClass = 'border-green-500 bg-green-50'
                  else if (isSelected) optClass = 'border-red-500 bg-red-50'
                } else if (isSelected) {
                  optClass = 'border-[#005696] bg-blue-50 animate-pulse-glow'
                }
                return (
                  <label
                    key={i}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${optClass}`}
                    style={{ animation: `pop-in 0.35s ease-out ${i * 0.08}s forwards`, opacity: 0 }}
                  >
                    <input type="radio" name={`q-${q.id}`} value={opt} checked={isSelected} onChange={() => handleAnswer(opt)} disabled={isLocked} className="accent-[#005696]" />
                    <span className="text-sm text-gray-700">{opt}</span>
                    {isLocked && isCorrect && <i className="fas fa-check-circle text-green-500 ml-auto text-lg" style={{ animation: 'pop-in 0.35s ease-out forwards' }}></i>}
                    {isLocked && isSelected && !isCorrect && <i className="fas fa-times-circle text-red-500 ml-auto text-lg" style={{ animation: 'pop-in 0.35s ease-out forwards' }}></i>}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={goBack} disabled={currentIndex === 0 || submitting}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-30 transition-all duration-200 font-medium active:scale-95">
            <i className="fas fa-chevron-left mr-1 text-xs"></i>
            Sebelumnya
          </button>
          <button onClick={goNext} disabled={!answers[q.id] || submitting}
            className="flex-1 px-6 py-3 rounded-xl bg-[#005696] text-white font-bold hover:bg-[#003d6e] disabled:opacity-50 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md">
            {submitting ? (
              <span className="flex items-center justify-center gap-2"><i className="fas fa-spinner animate-spin"></i>Mengirim...</span>
            ) : isLast ? (
              <span className="flex items-center justify-center gap-2">Selesai <i className="fas fa-check text-xs"></i></span>
            ) : (
              <span className="flex items-center justify-center gap-2">Selanjutnya <i className="fas fa-chevron-right text-xs"></i></span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
