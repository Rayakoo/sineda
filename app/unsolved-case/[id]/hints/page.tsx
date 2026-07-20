'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getHints, getUnsolvedCase } from '@/services/unsolvedCase'
import { getCourse } from '@/services/courses'
import { transformImageUrl } from '@/lib/image'
import { getDetectiveName, getConfirmed, getRevealedHints, addRevealedHint } from '@/lib/unsolvedCaseStorage'
import type { UnsolvedCaseHint, UnsolvedCaseHintType, UnsolvedCaseHintKartu } from '@/types/course'

function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(500px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`
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

function DraggableKartuPopup({ konten, onClose }: { konten: UnsolvedCaseHintKartu; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const offset = useRef({ x: 0, y: 0 })
  const [style, setStyle] = useState({ left: '50%', top: '50%' })
  const [grabbing, setGrabbing] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    setStyle({ left: '50%', top: '50%' })
  }, [])

  useEffect(() => {
    if (!grabbing) return
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX - offset.current.x, y: e.clientY - offset.current.y }
      setStyle({ left: pos.current.x + 'px', top: pos.current.y + 'px' })
    }
    const up = () => setGrabbing(false)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    return () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
  }, [grabbing])

  return (
    <div className="fixed inset-0 z-50 bg-[#3c2415]/60 backdrop-blur-sm" onClick={onClose}>
      {grabbing && <style>{`body { user-select: none; }`}</style>}
      <div
        ref={ref}
        className="absolute inline-flex flex-col items-center"
        style={{
          left: style.left,
          top: style.top,
          transform: style.left === '50%' ? 'translate(-50%, -50%)' : 'translate(0, 0)',
          cursor: grabbing ? 'grabbing' : 'grab',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          const el = ref.current
          if (!el) return
          const rect = el.getBoundingClientRect()
          offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
          pos.current = { x: rect.left, y: rect.top }
          setGrabbing(true)
        }}
      >
        <KartuFlip konten={konten} zoomed={zoomed} />
        <div className="flex justify-center gap-2 mt-8">
          <button
            onClick={() => setZoomed(!zoomed)}
            className="text-[11px] text-white/80 hover:text-white bg-[#3c2415]/60 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1"
          >
            <i className={`fas fa-${zoomed ? 'compress' : 'expand'} text-[10px]`}></i>
            {zoomed ? 'Perkecil' : 'Perbesar'}
          </button>
          <button
            onClick={onClose}
            className="text-[11px] text-white/80 hover:text-white bg-[#3c2415]/60 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1"
          >
            <i className="fas fa-times text-[10px]"></i>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function KartuFlip({ konten, zoomed }: { konten: UnsolvedCaseHintKartu; zoomed?: boolean }) {
  const [flipped, setFlipped] = useState(false)
  const tiltRef = useRef<HTMLDivElement>(null)

  const handleMouse = useCallback((e: React.MouseEvent) => {
    const el = tiltRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`
  }, [])

  const reset = useCallback(() => {
    const el = tiltRef.current
    if (!el) return
    el.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }, [])

  return (
    <div
      className="relative mx-auto"
      style={{
        width: zoomed ? 'min(90vw, 600px)' : 'min(80vw, 340px)',
        aspectRatio: '4 / 3',
        animation: 'kartuFloat 4s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes kartuFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
      <div
        ref={tiltRef}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        className="absolute inset-0 transition-transform duration-150 ease-out cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s ease-in-out',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
          }}
        >
          <div className="absolute inset-0 rounded-xl overflow-hidden shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}>
            {konten.kartu_depan ? (
              <img src={transformImageUrl(konten.kartu_depan)} alt="Kartu depan" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f5efe6] text-[#a09080] text-sm">Depan</div>
            )}
          </div>
          <div className="absolute inset-0 rounded-xl overflow-hidden shadow-lg"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            {konten.kartu_belakang ? (
              <img src={transformImageUrl(konten.kartu_belakang)} alt="Kartu belakang" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#f5efe6] text-[#a09080] text-sm">Belakang</div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-7 left-0 right-0 text-center">
        <p className="text-[10px] text-white/70 font-mono italic">
          <i className="fas fa-undo-alt mr-1"></i>
          Tekan untuk memutar kartu
        </p>
      </div>
    </div>
  )
}

const CATEGORY_CONFIG: Record<UnsolvedCaseHintType, { icon: string; label: string; color: string; rotate: string; offset: string }> = {
  chat: { icon: 'fa-message', label: 'Chat', color: 'from-emerald-500 to-emerald-700', rotate: '-rotate-2', offset: 'ml-0' },
  buku: { icon: 'fa-book', label: 'Buku', color: 'from-amber-600 to-amber-800', rotate: 'rotate-1', offset: 'ml-8' },
  kartu: { icon: 'fa-id-card', label: 'Kartu', color: 'from-blue-600 to-blue-800', rotate: '-rotate-1', offset: 'ml-4' },
  karakter: { icon: 'fa-user', label: 'Karakter', color: 'from-purple-600 to-purple-800', rotate: 'rotate-3', offset: '-ml-4' },
  lainnya: { icon: 'fa-paperclip', label: 'Lainnya', color: 'from-stone-600 to-stone-800', rotate: '-rotate-3', offset: 'ml-12' },
}

export default function HintsPage() {
  const params = useParams()
  const courseId = params?.id as string
  const [hints, setHints] = useState<UnsolvedCaseHint[]>([])
  const [unsolvedCaseId, setUnsolvedCaseId] = useState('')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)
  const [denied, setDenied] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<UnsolvedCaseHintType | null>(null)
  const [selectedKartuId, setSelectedKartuId] = useState<string | null>(null)
  const [kartuPopup, setKartuPopup] = useState<{ konten: UnsolvedCaseHintKartu } | null>(null)

  useEffect(() => {
    const name = getDetectiveName()
    const confirmed = getConfirmed()
    if (!name || !confirmed) { setDenied(true); setReady(true); return }

    getCourse(courseId).then((c) => {
      if (!c) { setReady(true); return }
      getUnsolvedCase(c.id).then((uc) => {
        if (uc) {
          setUnsolvedCaseId(uc.id)
          getHints(uc.id).then((h) => setHints(h))
          setRevealed(getRevealedHints(uc.id))
        }
        setReady(true)
      })
    })
  }, [courseId])

  const reveal = (id: string) => {
    if (!unsolvedCaseId) return
    addRevealedHint(unsolvedCaseId, id)
    setRevealed(new Set([...revealed, id]))
  }

  const grouped = hints.reduce((acc, h) => {
    if (!acc[h.tipe]) acc[h.tipe] = []
    acc[h.tipe].push(h)
    return acc
  }, {} as Record<string, UnsolvedCaseHint[]>)

  useEffect(() => {
    if (!selectedKartuId || selectedCategory !== 'kartu') {
      setKartuPopup(null)
      return
    }
    const hint = grouped['kartu']?.find(h => h.id === selectedKartuId)
    if (hint) setKartuPopup({ konten: hint.konten as UnsolvedCaseHintKartu })
  }, [selectedKartuId, selectedCategory])

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-[#8b4513] border-t-transparent rounded-full animate-spin" />
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

  if (selectedCategory) {
    const catHints = grouped[selectedCategory] || []
    const cfg = CATEGORY_CONFIG[selectedCategory]

    return (
      <>
      <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] overflow-hidden">
        <div className="bg-[#5c3d2e] text-white px-5 py-3 flex items-center gap-2">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedKartuId(null); setKartuPopup(null) }}
            className="hover:text-[#c4a882] transition-colors"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <i className={`fas ${cfg.icon} text-sm`}></i>
          <h2 className="font-bold text-sm uppercase tracking-wider">{cfg.label}</h2>
          <span className="text-xs text-[#c4a882] ml-auto font-mono">{catHints.length} petunjuk</span>
        </div>
        <div className="p-4 md:p-5 space-y-4">
          {selectedCategory === 'kartu' && selectedKartuId ? null : (
            catHints.map((hint) => (
              <div key={hint.id}>
                {revealed.has(hint.id) || selectedCategory === 'kartu' ? (
                  selectedCategory === 'kartu' ? (
                    <button
                      onClick={() => { setSelectedKartuId(hint.id) }}
                      className="w-full text-left bg-white border border-[#d4c4a8] rounded-xl px-4 py-3.5 hover:border-[#8b4513]/50 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0">
                          <i className="fas fa-id-card text-white text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3c2415] truncate">
                            {(hint.konten as UnsolvedCaseHintKartu).nama_kartu}
                          </p>
                          <p className="text-[10px] text-[#8b7355] mt-0.5">Klik untuk lihat kartu</p>
                        </div>
                        <i className="fas fa-chevron-right text-[#c4a882] text-xs group-hover:translate-x-0.5 transition-transform"></i>
                      </div>
                    </button>
                  ) : (
                    <TiltCard>
                      <div className="bg-white border border-[#c4a882] rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold text-[#8b4513] bg-[#e8dcc8] px-2 py-0.5 rounded-full border border-[#c4a882]">
                            <i className={`fas ${cfg.icon} mr-1`}></i>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="text-[#3c2415] text-sm leading-relaxed">
                          {hint.tipe === 'chat' && <ChatContent konten={hint.konten as any} />}
                          {hint.tipe === 'buku' && <BukuContent konten={hint.konten as any} />}
                          {hint.tipe === 'karakter' && <KarakterContent konten={hint.konten as any} />}
                          {hint.tipe === 'lainnya' && <LainnyaContent konten={hint.konten as any} />}
                        </div>
                      </div>
                    </TiltCard>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => reveal(hint.id)}
                    className="w-full flex items-center justify-between bg-white border border-[#d4c4a8] rounded-xl px-4 py-3 hover:border-[#8b4513]/40 transition-colors text-left group"
                  >
                    <span className="text-sm font-medium text-[#8b7355] group-hover:text-[#5c3d2e] transition-colors">
                      <i className="fas fa-lock mr-2 text-[#c4a882]"></i>
                      Petunjuk {cfg.label}
                    </span>
                    <i className="fas fa-chevron-right text-[#c4a882] text-xs"></i>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {kartuPopup && (
        <DraggableKartuPopup konten={kartuPopup.konten} onClose={() => { setKartuPopup(null); setSelectedKartuId(null) }} />
      )}
      </>
    )
  }

  return (
    <>
    {kartuPopup && (
      <DraggableKartuPopup konten={kartuPopup.konten} onClose={() => { setKartuPopup(null); setSelectedKartuId(null) }} />
    )}
    <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(139, 69, 19, 0.08)' }}
    >
      <div className="bg-[#5c3d2e] text-white px-5 py-3 flex items-center gap-2">
        <i className="fas fa-lightbulb text-sm text-amber-300"></i>
        <h2 className="font-bold text-sm uppercase tracking-wider">Petunjuk</h2>
        <span className="text-xs text-[#c4a882] ml-auto font-mono">{revealed.size}/{hints.length}</span>
      </div>
      <div className="p-6 md:p-8">
        {hints.length === 0 ? (
          <p className="text-sm text-[#a09080] italic text-center py-6">Belum ada petunjuk.</p>
        ) : (
          <>
            <div
              className="relative min-h-[320px] bg-[#e8dcc8] rounded-2xl border-2 border-[#c4a882] p-6 mb-4"
              style={{
                backgroundImage: 'radial-gradient(#c4a88230 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                boxShadow: 'inset 0 2px 8px rgba(139, 69, 19, 0.06)',
              }}
            >
              <p className="text-[10px] text-[#8b7355] font-mono text-center mb-6 italic">
                Pilih petunjuk yang ingin diperiksa
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {Object.entries(grouped).map(([tipe, items], idx) => {
                  const cfg = CATEGORY_CONFIG[tipe as UnsolvedCaseHintType]
                  const revealedCount = items.filter(h => revealed.has(h.id)).length
                  return (
                    <TiltCard key={tipe}>
                      <button
                        onClick={() => setSelectedCategory(tipe as UnsolvedCaseHintType)}
                        className={`bg-white rounded-2xl border-2 border-[#d4c4a8] p-5 shadow-md hover:shadow-lg transition-all text-center w-36 ${cfg.rotate}`}
                        style={{
                          marginTop: idx % 2 === 0 ? '0px' : '16px',
                        }}
                      >
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cfg.color} flex items-center justify-center mx-auto mb-3 shadow-sm`}
                        >
                          <i className={`fas ${cfg.icon} text-white text-xl`}></i>
                        </div>
                        <p className="font-bold text-sm text-[#3c2415]">{cfg.label}</p>
                        <p className="text-[10px] text-[#8b7355] mt-1 font-mono">
                          {revealedCount}/{items.length}
                        </p>
                      </button>
                    </TiltCard>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  )
}

function ChatContent({ konten }: { konten: any }) {
  return (
    <div className="space-y-2">
      {konten.judul_hint && <p className="font-bold">{konten.judul_hint}</p>}
      {konten.nama_lawan_chat && (
        <p className="text-xs text-[#8b7355] italic">Dari: {konten.nama_lawan_chat}</p>
      )}
      {konten.images?.map((img: string, i: number) => (
        <img key={i} src={transformImageUrl(img)} alt={`Chat ${i + 1}`} className="max-h-48 rounded-lg border border-[#d4c4a8]" />
      ))}
    </div>
  )
}

function BukuContent({ konten }: { konten: any }) {
  return (
    <div className="space-y-2">
      <p className="font-bold italic" style={{ fontFamily: 'serif' }}>{konten.judul_buku}</p>
      {konten.cover_buku && (
        <img src={transformImageUrl(konten.cover_buku)} alt="Cover" className="max-h-40 rounded-lg border border-[#c4a882]" />
      )}
      {konten.isi_buku?.map((img: string, i: number) => (
        <img key={i} src={transformImageUrl(img)} alt={`Halaman ${i + 1}`} className="max-h-40 rounded-lg border border-[#d4c4a8]" />
      ))}
    </div>
  )
}

function KarakterContent({ konten }: { konten: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {konten.foto_karakter && (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c4a882] shrink-0 bg-[#e8dcc8]">
            <img src={transformImageUrl(konten.foto_karakter)} alt={konten.nama} className="w-full h-full object-cover" />
          </div>
        )}
        <p className="font-bold">{konten.nama}</p>
      </div>
      {konten.images?.map((img: string, i: number) => (
        <img key={i} src={transformImageUrl(img)} alt={`Kesaksian ${i + 1}`} className="max-h-40 rounded-lg border border-[#d4c4a8]" />
      ))}
    </div>
  )
}

function LainnyaContent({ konten }: { konten: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-bold">{konten.nama_hint}</p>
        {konten.jumlah > 1 && (
          <span className="bg-[#e8dcc8] text-[#8b4513] text-[10px] font-bold px-2 py-0.5 rounded-full">x{konten.jumlah}</span>
        )}
      </div>
      {konten.gambar && (
        <img src={transformImageUrl(konten.gambar)} alt={konten.nama_hint} className="max-h-40 rounded-lg border border-[#d4c4a8]" />
      )}
    </div>
  )
}
