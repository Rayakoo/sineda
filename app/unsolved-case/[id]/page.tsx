'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getDetectiveName, setDetectiveName as saveName, setConfirmed as saveConfirmed, getDraftName, setDraftName, clearDraftName } from '@/lib/unsolvedCaseStorage'
import { transformImageUrl } from '@/lib/image'
import { getCourse } from '@/services/courses'

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`
  }, [])

  const reset = useCallback(() => {
    if (!ref.current) return
    ref.current.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg)'
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

function CardPreview({ name, size = 'w-44' }: { name: string; size?: string }) {
  return (
    <TiltCard>
      <div className={`relative ${size} mx-auto rounded-xl shadow-lg border-2 border-[#c4a882] overflow-hidden bg-white`}>
        <img src="/card_detektif.png" alt="Kartu Identitas" className="w-full h-auto" />
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
        >
          {name}
        </p>
      </div>
    </TiltCard>
  )
}

export default function DetectiveNamePage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params?.id as string
  const [popupName, setPopupName] = useState('')
  const [showPopup, setShowPopup] = useState(false)
  const [existingName, setExistingName] = useState('')
  const [courseImage, setCourseImage] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [envelopeOpen, setEnvelopeOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = getDetectiveName() || getDraftName(courseId)
    setExistingName(saved)
    if (saved) setPopupName(saved)
  }, [courseId])

  useEffect(() => {
    getCourse(courseId).then(c => {
      if (c) {
        setCourseImage(c.image || '')
        setCourseTitle(c.title)
      }
    })
  }, [courseId])

  useEffect(() => {
    if (!showPopup) return
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false)
      }
    }
    setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => document.removeEventListener('click', handleClick)
  }, [showPopup])

  const confirm = () => {
    if (!popupName.trim()) return
    clearDraftName(courseId)
    saveName(popupName.trim())
    saveConfirmed(true)
    setExistingName(popupName.trim())
    setShowPopup(false)
    if (!existingName) {
      router.push(`/unsolved-case/${courseId}/files`)
    }
  }

  return (
    <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] p-6 md:p-10 text-center relative overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(139, 69, 19, 0.08)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8b4513]"></div>

      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 bg-[#e8dcc8] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#c4a882]">
          <i className="fas fa-user-secret text-3xl text-[#8b4513]"></i>
        </div>

        {courseImage && (
          <div className="mb-2 max-w-[300px] mx-auto w-full">
            <style>{`
              .env-flap {
                transform-origin: bottom center;
                transition: transform 0.4s ease-in-out;
                transform-style: preserve-3d;
              }
              .env-flap.open { transform: rotateX(180deg); }
              .arrow-bounce {
                animation: arrowBounce 1.8s ease-in-out infinite;
              }
              @keyframes arrowBounce {
                0%, 100% { transform: translateY(0); opacity: 0.5; }
                50% { transform: translateY(5px); opacity: 1; }
              }
            `}</style>

            {!envelopeOpen && (
              <div className="flex flex-col items-center gap-0.5 mb-3 text-[#8b4513] arrow-bounce">
                <i className="fas fa-chevron-down text-xs"></i>
                <p className="text-[10px] font-semibold italic font-mono text-center leading-relaxed">
                  &quot;Detektif, tolong selesaikan kasus ini.&quot;
                </p>
              </div>
            )}

            <div
              className="relative cursor-pointer select-none"
              style={{ perspective: '700px' }}
              onClick={() => setEnvelopeOpen(!envelopeOpen)}
            >
              <div className="absolute left-1/2 z-0"
                style={{
                  top: envelopeOpen ? -72 : 160,
                  transform: 'translateX(-50%)',
                  transition: envelopeOpen
                    ? 'top 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)'
                    : 'top 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                <div className="bg-white rounded-xl shadow-lg border-2 border-[#c4a882] overflow-hidden"
                  style={{ width: 224, height: 148 }}>
                  <img
                    src={transformImageUrl(courseImage)}
                    alt="Gambar Kasus"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              </div>

              <div
                className="relative border-2 border-[#b8a48a] rounded-b-lg shadow-md z-10"
                style={{
                  background: 'linear-gradient(160deg, #d4c4a8 0%, #c4b098 50%, #d4c4a8 100%)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-b-lg opacity-[0.06]"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #5c3d2e 10px, #5c3d2e 11px)',
                  }}
                />

                <div className="relative px-5 pt-14 pb-40 text-center">
                  <p className="text-[10px] text-[#8b7355] font-mono uppercase tracking-[0.15em] mb-2">JUDUL BERKAS</p>
                  <p className="text-sm font-bold text-[#3c2415] uppercase tracking-wider leading-snug">
                    {courseTitle || '—'}
                  </p>
                  <div className="w-14 h-[2px] bg-[#8b7355]/30 mx-auto my-3" />
                  <i className="fas fa-stamp text-[#8b4513]/20 text-2xl mb-1" />
                  <p className="text-[10px] text-[#5c3d2e] font-bold font-mono uppercase tracking-[0.25em]">SANGAT RAHASIA</p>
                  <p className="text-[9px] text-[#5c3d2e]/80 font-semibold font-mono mt-2">
                    {envelopeOpen ? '— tutup —' : '— buka amplop —'}
                  </p>
                </div>
              </div>

              <div
                className="absolute -top-[2px] left-0 right-0 z-20"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div
                  className={`env-flap ${envelopeOpen ? 'open' : ''}`}
                  style={{
                    height: 28,
                    clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                    background: 'linear-gradient(160deg, #c4b098 0%, #b8a48a 50%, #c4b098 100%)',
                    borderLeft: '2px solid #b8a48a',
                    borderRight: '2px solid #b8a48a',
                    borderTop: '2px solid #b8a48a',
                    backfaceVisibility: 'hidden',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {existingName ? (
          <>
            <h2 className="text-xl md:text-2xl font-bold text-[#3c2415] mb-1" style={{ fontFamily: 'serif' }}>
              Detektif {existingName}
            </h2>
            <p className="text-sm text-[#8b7355] mb-6 italic">
              Identitasmu sudah siap. Lanjutkan investigasi atau edit namamu.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push(`/unsolved-case/${courseId}/files`)}
                className="inline-flex items-center gap-2 bg-[#8b4513] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#6b3410] transition-all shadow-sm"
              >
                <i className="fas fa-folder-open"></i>
                Lanjut ke Berkas
              </button>
              <button
                onClick={() => setShowPopup(true)}
                className="inline-flex items-center gap-2 bg-white border-2 border-[#d4c4a8] text-[#8b7355] px-5 py-3 rounded-xl text-sm font-semibold hover:border-[#8b4513] hover:text-[#8b4513] transition-all"
              >
                <i className="fas fa-pen"></i>
                Edit Nama
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl md:text-2xl font-bold text-[#3c2415] mb-2" style={{ fontFamily: 'serif' }}>
              Selamat Datang, Detektif
            </h2>
            <p className="text-sm text-[#8b7355] mb-8 italic">
              Sebuah kasus baru menanti. Siapkan identitasmu sebelum menyelidiki.
            </p>

            <button
              onClick={() => setShowPopup(true)}
              className="bg-[#faf6f0] border-2 border-dashed border-[#c4a882] hover:border-[#8b4513] hover:bg-white rounded-2xl p-8 w-full transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center gap-4">
                <CardPreview name="—" />
                <div>
                  <p className="font-bold text-[#3c2415] text-sm">Siapa namamu, Detektif?</p>
                  <p className="text-xs text-[#a09080] mt-1 italic">Klik untuk mengisi kartu identitas</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#8b4513] font-semibold group-hover:gap-3 transition-all">
                  <span>Mulai</span>
                  <i className="fas fa-arrow-right text-xs"></i>
                </div>
              </div>
            </button>
          </>
        )}

        <p className="text-[10px] text-[#a09080] mt-6 italic">
          &quot;Setiap detektif hebat memulai dengan nama.&quot;
        </p>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3c2415]/60 backdrop-blur-sm">
          <div
            ref={popupRef}
            className="bg-[#f5efe6] rounded-2xl shadow-2xl border border-[#c4a882] p-6 w-full max-w-sm mx-4"
            style={{
              animation: 'popIn 0.35s ease-out',
              boxShadow: '0 20px 60px rgba(60, 36, 21, 0.3)',
            }}
          >
            <style>{`
              @keyframes popIn {
                from { opacity: 0; transform: translateY(30px) scale(0.92); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#8b4513] rounded-t-2xl"></div>

            <div className="text-center mb-5 pt-2">
              <div className="w-14 h-14 bg-[#e8dcc8] rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-[#c4a882]">
                <i className="fas fa-id-card text-xl text-[#8b4513]"></i>
              </div>
              <h3 className="font-bold text-[#3c2415]" style={{ fontFamily: 'serif' }}>
                {existingName ? 'Edit Identitas Detektif' : 'Kartu Identitas Detektif'}
              </h3>
              <p className="text-xs text-[#8b7355] mt-1 italic">
                {existingName ? 'Perbaiki namamu sebelum melanjutkan' : 'Masukkan namamu untuk memulai investigasi'}
              </p>
            </div>

            <CardPreview name={popupName || '—'} size="max-w-[200px]" />

            <div className="mt-5">
              <input
                type="text"
                value={popupName}
                onChange={(e) => {
                  const v = e.target.value
                  setPopupName(v)
                  setDraftName(courseId, v)
                }}
                placeholder="Nama panggilan detektif..."
                maxLength={20}
                autoFocus
                className="w-full bg-white border-2 border-[#d4c4a8] rounded-xl px-4 py-3 text-sm text-[#3c2415] outline-none focus:border-[#8b4513] focus:ring-2 focus:ring-[#8b4513]/20 placeholder:text-[#a09080] text-center font-bold uppercase tracking-wider transition-colors"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowPopup(false)}
                className="flex-1 px-4 py-2.5 border-2 border-[#d4c4a8] rounded-xl text-sm font-semibold text-[#8b7355] hover:bg-white hover:border-[#c4a882] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirm}
                disabled={!popupName.trim()}
                className="flex-1 px-4 py-2.5 bg-[#8b4513] text-white rounded-xl text-sm font-bold hover:bg-[#6b3410] transition-colors disabled:opacity-40 border-2 border-[#8b4513]"
              >
                {existingName ? 'Simpan' : 'Siap!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
