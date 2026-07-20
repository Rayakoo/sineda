'use client'

import { useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCourse, getCachedCourse } from '@/services/courses'
import { getUnsolvedCase, getHints } from '@/services/unsolvedCase'
import { getDetectiveName, getConfirmed, getRevealedHints } from '@/lib/unsolvedCaseStorage'
import type { Course, UnsolvedCase, UnsolvedCaseHint } from '@/types/course'

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(500px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`
  }, [])

  const reset = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(500px) rotateY(0deg) rotateX(0deg)'
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      className={`transition-transform duration-150 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}

type Props = { children: ReactNode }

const STEPS = [
  { path: '', label: 'Identitas', icon: 'fa-id-card' },
  { path: '/files', label: 'Berkas', icon: 'fa-folder-open' },
  { path: '/hints', label: 'Petunjuk', icon: 'fa-lightbulb' },
  { path: '/answer', label: 'Laporan', icon: 'fa-pen' },
]

export default function UnsolvedCaseLayout({ children }: Props) {
  const params = useParams()
  const pathname = usePathname()
  const courseId = params?.id as string
  const basePath = `/unsolved-case/${courseId}`

  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<Course | null>(getCachedCourse(courseId) ?? null)
  const [unsolvedCase, setUnsolvedCase] = useState<UnsolvedCase | null>(null)
  const [hints, setHints] = useState<UnsolvedCaseHint[]>([])
  const [detectiveName, setDetectiveNameState] = useState('')
  const [confirmed, setConfirmedState] = useState(false)
  const [revealedHints, setRevealedHintsState] = useState<Set<string>>(new Set())

  useEffect(() => {
    setDetectiveNameState(getDetectiveName())
    setConfirmedState(getConfirmed())
  }, [])

  useEffect(() => {
    if (!courseId) return
    const load = async () => {
      const c = await getCourse(courseId)
      if (!c) { setLoading(false); return }
      setCourse(c)
      const uc = await getUnsolvedCase(c.id)
      if (uc) {
        setUnsolvedCase(uc)
        const h = await getHints(uc.id)
        setHints(h)
        setRevealedHintsState(getRevealedHints(uc.id))
      }
      setLoading(false)
    }
    load()
  }, [courseId])

  useEffect(() => {
    if (!unsolvedCase) return
    const handle = () => setRevealedHintsState(getRevealedHints(unsolvedCase.id))
    window.addEventListener('storage', handle)
    return () => window.removeEventListener('storage', handle)
  }, [unsolvedCase])

  useEffect(() => {
    const interval = setInterval(() => {
      setDetectiveNameState(getDetectiveName())
      setConfirmedState(getConfirmed())
      if (unsolvedCase) setRevealedHintsState(getRevealedHints(unsolvedCase.id))
    }, 500)
    return () => clearInterval(interval)
  }, [unsolvedCase])

  const currentStep = STEPS.findIndex((s) => {
    if (s.path === '') return pathname === basePath || pathname === `${basePath}/`
    return pathname === `${basePath}${s.path}`
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8dcc8] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[#8b4513] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!course || !unsolvedCase) {
    return (
      <div className="min-h-screen bg-[#e8dcc8] flex items-center justify-center text-[#5c3d2e]">
        <div className="text-center bg-white/80 p-8 rounded-2xl shadow-lg border border-[#c4a882]">
          <i className="fas fa-magnifying-glass text-4xl mb-3 text-[#8b4513]"></i>
          <p className="font-medium">Berkas tidak ditemukan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#e8dcc8]" style={{ backgroundImage: 'radial-gradient(#c4a88220 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6">
        <nav className="flex items-center justify-between mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-[#3c2415] text-[#e8dcc8] px-4 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-[#2a1a0e] transition-all shadow-sm"
          >
            <i className="fas fa-chevron-left text-xs"></i>
            Kembali
          </Link>
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#8b7355] font-semibold uppercase tracking-widest">
            <i className="fas fa-fingerprint text-[#8b4513]"></i>
            Berkas Rahasia
          </div>
        </nav>

        <div
          className="bg-[#f5efe6] rounded-2xl shadow-lg border border-[#c4a882] p-4 md:p-6 mb-4 relative overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(139, 69, 19, 0.1)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#8b4513]"></div>
          <div className="flex items-center gap-2 text-[10px] md:text-xs text-[#8b7355] font-semibold uppercase tracking-wider mb-1">
            <i className="fas fa-magnifying-glass text-[#8b4513]"></i>
            Kasus Misterius
          </div>
          <h1 className="text-lg md:text-2xl font-bold text-[#3c2415]" style={{ fontFamily: 'serif' }}>
            {unsolvedCase.title}
          </h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2 mb-5 overflow-x-auto pb-1">
          {STEPS.map((step, i) => {
            const href = `${basePath}${step.path}`
            const isActive = currentStep === i
            const isPast = currentStep > i
            return (
              <Link
                key={step.path}
                href={href}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#8b4513] text-white shadow-sm'
                    : isPast
                      ? 'bg-[#d4c4a8] text-[#5c3d2e] hover:bg-[#c4a882]'
                      : 'bg-[#e8dcc8] text-[#a09080]'
                }`}
              >
                <i className={`fas ${step.icon} text-[10px] md:text-xs`}></i>
                <span className="hidden sm:inline">{step.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {children}
          </div>
          <div className="space-y-4">
            {confirmed ? (
              <TiltCard className="w-48 md:w-56 mx-auto">
                <div
                  className="relative"
                  style={{
                    animation: 'cardFloat 3s ease-in-out infinite',
                  }}
                >
                  <style>{`
                    @keyframes cardFloat {
                      0%, 100% { transform: translateY(0px); }
                      50% { transform: translateY(-6px); }
                    }
                  `}</style>
                  <div className="absolute -inset-1 bg-[#8b4513]/10 rounded-2xl blur-sm"></div>
                  <div className="relative bg-white rounded-xl shadow-lg border border-[#c4a882] overflow-hidden">
                    <img src="/card_detektif.png" alt="Kartu Identitas Detektif" className="w-full h-auto" />
                    <p
                      style={{
                        position: 'absolute',
                        left: '18%',
                        right: '12%',
                        top: '60%',
                        fontSize: 'clamp(0.7rem, 2.5vw, 1rem)',
                        fontWeight: 700,
                        color: '#1a1a2e',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'center',
                      }}
                      className="select-none"
                    >
                      {detectiveName}
                    </p>
                  </div>
                </div>
              </TiltCard>
            ) : (
              <Link
                href={basePath}
                className="block w-full bg-[#f5efe6] rounded-2xl p-5 border-2 border-dashed border-[#c4a882] hover:border-[#8b4513]/50 hover:bg-white transition-all group"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-12 h-12 bg-[#e8dcc8] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i className="fas fa-user-secret text-xl text-[#8b4513]"></i>
                  </div>
                  <p className="font-bold text-sm text-[#3c2415]">Siapa namamu, Detektif?</p>
                  <p className="text-xs text-[#a09080] italic">Klik untuk membuat kartu identitas</p>
                </div>
              </Link>
            )}

            <div className="bg-[#f5efe6] rounded-xl shadow-md border border-[#c4a882] p-4">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#e8dcc8]">
                <i className="fas fa-clipboard-list text-[#8b4513] text-xs"></i>
                <h3 className="text-xs font-bold text-[#5c3d2e] uppercase tracking-wider">Status Kasus</h3>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#8b7355]">Petunjuk</span>
                  <span className="font-bold text-[#3c2415] font-mono">{revealedHints.size}/{hints.length}</span>
                </div>
                <div className="w-full h-1.5 bg-[#e8dcc8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8b4513] rounded-full transition-all duration-300"
                    style={{ width: `${hints.length ? (revealedHints.size / hints.length) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8b7355]">Identitas</span>
                  <span className={`font-bold font-mono ${confirmed ? 'text-green-700' : 'text-[#a09080]'}`}>
                    {confirmed ? 'OK' : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-[#a09080] italic font-mono leading-relaxed">
              &quot;Kebenaran tidak pernah<br/>bersembunyi selamanya.&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
