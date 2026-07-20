'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDetectiveName, getConfirmed, clearAll } from '@/lib/unsolvedCaseStorage'
import { getCourse, getCachedCourse } from '@/services/courses'
import { getUnsolvedCase, submitDetective } from '@/services/unsolvedCase'

export default function AnswerPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string
  const [answers, setAnswers] = useState('')
  const [sending, setSending] = useState(false)
  const [denied, setDenied] = useState(false)
  const [sent, setSent] = useState(false)
  const [detectiveName, setDetectiveNameState] = useState('')

  useEffect(() => {
    const name = getDetectiveName()
    const confirmed = getConfirmed()
    setDetectiveNameState(name)
    if (!name || !confirmed) setDenied(true)
  }, [])

  const handleSubmit = async () => {
    if (!answers.trim() || sending) return
    setSending(true)
    try {
      const c = await getCourse(courseId)
      if (!c) return
      const uc = await getUnsolvedCase(c.id)
      if (!uc) return
      await submitDetective({
        unsolved_case_id: uc.id,
        detective_name: detectiveName,
        answers: [{ text: answers }],
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      setSent(true)
      clearAll(uc.id, courseId)
    } catch {
      alert('Gagal mengirim laporan')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] p-8 md:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8b4513]"></div>
        <div className="w-16 h-16 bg-[#8b4513]/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-2xl text-[#8b4513]"></i>
        </div>
        <h2 className="text-xl font-bold text-[#3c2415] mb-2" style={{ fontFamily: 'serif' }}>Laporan Terkirim!</h2>
        <p className="text-sm text-[#8b7355] mb-1">
          Terima kasih, Detektif <span className="font-bold text-[#5c3d2e]">{detectiveName}</span>.
        </p>
        <p className="text-xs text-[#a09080] mb-6 italic">&quot;Kebenaran tidak pernah bersembunyi selamanya.&quot;</p>
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 bg-[#8b4513] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#6b3410] transition-all shadow-sm"
        >
          <i className="fas fa-arrow-left text-xs"></i> Kembali
        </button>
      </div>
    )
  }

  if (denied) {
    return (
      <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] p-8 text-center">
        <i className="fas fa-lock text-3xl text-[#a09080] mb-3"></i>
        <p className="text-sm text-[#8b7355]">Buat identitas detektif terlebih dahulu.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(139, 69, 19, 0.08)' }}
    >
      <div className="bg-[#3c2415] text-white px-5 py-3 flex items-center gap-2">
        <i className="fas fa-pen text-sm"></i>
        <h2 className="font-bold text-sm uppercase tracking-wider">Laporan Investigasi</h2>
      </div>
      <div className="p-4 md:p-5">
        <div className="flex items-center gap-3 bg-[#e8dcc8]/50 rounded-xl px-4 py-3 mb-4 border border-[#d4c4a8]">
          <i className="fas fa-user-secret text-[#8b4513]"></i>
          <div>
            <p className="text-[10px] text-[#8b7355] uppercase tracking-wider font-semibold">Detektif</p>
            <p className="text-sm font-bold text-[#3c2415]">{detectiveName}</p>
          </div>
        </div>

        <div className="bg-[#faf6f0] border border-[#e8dcc8] rounded-xl p-1">
          <textarea
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            placeholder="Tulis temuan dan kesimpulan investigasi kamu..."
            rows={6}
            className="w-full bg-transparent border-none px-4 py-3 text-sm text-[#3c2415] outline-none resize-none placeholder:text-[#a09080] rounded-xl"
          />
        </div>
        <p className="text-xs text-[#a09080] mt-2 italic flex items-center gap-1">
          <i className="fas fa-info-circle"></i>
          Siapa pelaku? Apa motifnya? Bukti apa yang kamu temukan?
        </p>

        <button
          onClick={handleSubmit}
          disabled={!answers.trim() || sending}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#8b4513] text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-[#6b3410] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
          {sending ? 'Mengirim...' : 'Kumpulkan Laporan'}
        </button>
      </div>
    </div>
  )
}
