'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getHints, getUnsolvedCase } from '@/services/unsolvedCase'
import { getCourse } from '@/services/courses'
import { transformImageUrl } from '@/lib/image'
import { getDetectiveName, getConfirmed, getRevealedHints, addRevealedHint } from '@/lib/unsolvedCaseStorage'
import type {
  UnsolvedCaseHint,
  UnsolvedCaseHintType,
  UnsolvedCaseHintBuku,
  UnsolvedCaseHintKartu,
  UnsolvedCaseHintChat,
  UnsolvedCaseHintKarakter,
  UnsolvedCaseHintLainnya,
} from '@/types/course'

function TiltCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
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
      style={{ transformStyle: 'preserve-3d', ...style }}
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
  const [selectedBukuId, setSelectedBukuId] = useState<string | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedKarakterId, setSelectedKarakterId] = useState<string | null>(null)
  const [selectedLainnyaId, setSelectedLainnyaId] = useState<string | null>(null)
  const [bookOpen, setBookOpen] = useState(false)
  const [karakterGalleryOpen, setKarakterGalleryOpen] = useState(false)
  const [lainnyaGalleryOpen, setLainnyaGalleryOpen] = useState(false)
  const [bookPage, setBookPage] = useState(0)
  const [chatPage, setChatPage] = useState(0)
  const [kartuPopup, setKartuPopup] = useState<{ konten: UnsolvedCaseHintKartu } | null>(null)
  const [hoveredHintType, setHoveredHintType] = useState<UnsolvedCaseHintType | null>(null)

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
    const selectedBukuHint = selectedBukuId ? catHints.find(h => h.id === selectedBukuId) : undefined
    const selectedChatHint = selectedChatId ? catHints.find(h => h.id === selectedChatId) : undefined
    const selectedKarakterHint = selectedKarakterId ? catHints.find(h => h.id === selectedKarakterId) : undefined
    const selectedLainnyaHint = selectedLainnyaId ? catHints.find(h => h.id === selectedLainnyaId) : undefined

    return (
      <>
      <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] overflow-hidden">
        <div className="bg-[#5c3d2e] text-white px-5 py-3 flex items-center gap-2">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedKartuId(null); setSelectedBukuId(null); setSelectedChatId(null); setSelectedKarakterId(null); setSelectedLainnyaId(null); setBookOpen(false); setKarakterGalleryOpen(false); setLainnyaGalleryOpen(false); setBookPage(0); setChatPage(0); setKartuPopup(null) }}
            className="hover:text-[#c4a882] transition-colors"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <i className={`fas ${cfg.icon} text-sm`}></i>
          <h2 className="font-bold text-sm uppercase tracking-wider">{cfg.label}</h2>
          <span className="text-xs text-[#c4a882] ml-auto font-mono">{catHints.length} petunjuk</span>
        </div>
        <div className="p-4 md:p-5 space-y-4">
          {selectedCategory === 'buku' ? (
            selectedBukuId && selectedBukuHint ? (
              bookOpen ? (
                <BukuReader
                  konten={selectedBukuHint.konten as UnsolvedCaseHintBuku}
                  onClose={() => { setBookOpen(false); setBookPage(0) }}
                  onBack={() => setBookOpen(false)}
                  pageIndex={bookPage}
                  onPageChange={setBookPage}
                />
              ) : (
                <BukuCoverPreview
                  konten={selectedBukuHint.konten as UnsolvedCaseHintBuku}
                  onOpenBook={() => setBookOpen(true)}
                  onBack={() => { setSelectedBukuId(null); setBookOpen(false); setBookPage(0) }}
                />
              )
            ) : (
              catHints.map((hint) => (
                <div key={hint.id}>
                  {revealed.has(hint.id) ? (
                    <button
                      onClick={() => { setSelectedBukuId(hint.id); setBookOpen(false); setBookPage(0) }}
                      className="w-full text-left bg-white border border-[#d4c4a8] rounded-xl px-4 py-3.5 hover:border-[#8b4513]/50 hover:shadow-[0_12px_24px_rgba(92,61,46,0.22)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shrink-0">
                          <i className="fas fa-book text-white text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3c2415] truncate">
                            {(hint.konten as UnsolvedCaseHintBuku).judul_buku}
                          </p>
                          <p className="text-[10px] text-[#8b7355] mt-0.5">Klik untuk buka sampul buku</p>
                        </div>
                        <i className="fas fa-chevron-right text-[#c4a882] text-xs group-hover:translate-x-0.5 transition-transform"></i>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reveal(hint.id)}
                      className="w-full flex items-center justify-between bg-white border border-[#d4c4a8] rounded-xl px-4 py-3 hover:border-[#8b4513]/40 transition-colors text-left group shadow-[0_12px_24px_rgba(92,61,46,0.22)] hover:shadow-[0_18px_30px_rgba(92,61,46,0.32)]"
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
            )
          ) : selectedCategory === 'chat' ? (
            selectedChatId && selectedChatHint ? (
              <ChatPhonePopup
                konten={selectedChatHint.konten as UnsolvedCaseHintChat}
                onClose={() => { setSelectedChatId(null); setChatPage(0) }}
                pageIndex={chatPage}
                onPageChange={setChatPage}
              />
            ) : (
              catHints.map((hint) => (
                <div key={hint.id}>
                  {revealed.has(hint.id) ? (
                    <button
                      onClick={() => { setSelectedChatId(hint.id); setChatPage(0) }}
                      className="w-full text-left bg-white border border-[#d4c4a8] rounded-xl px-4 py-3.5 hover:border-[#8b4513]/50 hover:shadow-[0_12px_24px_rgba(92,61,46,0.22)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0">
                          <i className="fas fa-message text-white text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3c2415] truncate">
                            {(hint.konten as UnsolvedCaseHintChat).judul_hint || (hint.konten as UnsolvedCaseHintChat).nama_lawan_chat || 'Chat'}
                          </p>
                          <p className="text-[10px] text-[#8b7355] mt-0.5">Klik untuk buka mockup chat</p>
                        </div>
                        <i className="fas fa-chevron-right text-[#c4a882] text-xs group-hover:translate-x-0.5 transition-transform"></i>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reveal(hint.id)}
                      className="w-full flex items-center justify-between bg-white border border-[#d4c4a8] rounded-xl px-4 py-3 hover:border-[#8b4513]/40 transition-colors text-left group shadow-[0_12px_24px_rgba(92,61,46,0.22)] hover:shadow-[0_18px_30px_rgba(92,61,46,0.32)]"
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
            )
          ) : selectedCategory === 'karakter' ? (
            selectedKarakterId && selectedKarakterHint ? (
              karakterGalleryOpen ? (
                <FloatingGalleryPopup
                  title={(selectedKarakterHint.konten as UnsolvedCaseHintKarakter).nama || 'Kesaksian Karakter'}
                  images={(selectedKarakterHint.konten as UnsolvedCaseHintKarakter).images || []}
                  onClose={() => { setKarakterGalleryOpen(false); setSelectedKarakterId(null) }}
                />
              ) : (
                <KarakterPreviewPopup
                  konten={selectedKarakterHint.konten as UnsolvedCaseHintKarakter}
                  onOpenGallery={() => setKarakterGalleryOpen(true)}
                  onBack={() => { setSelectedKarakterId(null); setKarakterGalleryOpen(false) }}
                />
              )
            ) : (
              catHints.map((hint) => (
                <div key={hint.id}>
                  {revealed.has(hint.id) ? (
                    <button
                      onClick={() => { setSelectedKarakterId(hint.id); setKarakterGalleryOpen(false) }}
                      className="w-full text-left bg-white border border-[#d4c4a8] rounded-xl px-4 py-3.5 hover:border-[#8b4513]/50 hover:shadow-[0_12px_24px_rgba(92,61,46,0.22)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shrink-0">
                          <i className="fas fa-user text-white text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3c2415] truncate">
                            {(hint.konten as UnsolvedCaseHintKarakter).nama || 'Karakter'}
                          </p>
                          <p className="text-[10px] text-[#8b7355] mt-0.5">Klik untuk buka profil karakter</p>
                        </div>
                        <i className="fas fa-chevron-right text-[#c4a882] text-xs group-hover:translate-x-0.5 transition-transform"></i>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reveal(hint.id)}
                      className="w-full flex items-center justify-between bg-white border border-[#d4c4a8] rounded-xl px-4 py-3 hover:border-[#8b4513]/40 transition-colors text-left group shadow-[0_12px_24px_rgba(92,61,46,0.22)] hover:shadow-[0_18px_30px_rgba(92,61,46,0.32)]"
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
            )
          ) : selectedCategory === 'lainnya' ? (
            selectedLainnyaId && selectedLainnyaHint ? (
              <FloatingGalleryPopup
                title={(selectedLainnyaHint.konten as UnsolvedCaseHintLainnya).nama_hint || 'Hint Lainnya'}
                images={Array.from({ length: Math.max(1, (selectedLainnyaHint.konten as UnsolvedCaseHintLainnya).jumlah || 1) }, () => (selectedLainnyaHint.konten as UnsolvedCaseHintLainnya).gambar).filter(Boolean)}
                onClose={() => { setSelectedLainnyaId(null); setLainnyaGalleryOpen(false) }}
                mode="stacked"
              />
            ) : (
              catHints.map((hint) => (
                <div key={hint.id}>
                  {revealed.has(hint.id) ? (
                    <button
                      onClick={() => { setSelectedLainnyaId(hint.id); setLainnyaGalleryOpen(true) }}
                      className="w-full text-left bg-white border border-[#d4c4a8] rounded-xl px-4 py-3.5 hover:border-[#8b4513]/50 hover:shadow-[0_12px_24px_rgba(92,61,46,0.22)] transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-500 to-stone-700 flex items-center justify-center shrink-0">
                          <i className="fas fa-paperclip text-white text-sm"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#3c2415] truncate">
                            {(hint.konten as UnsolvedCaseHintLainnya).jumlah || 1} - {(hint.konten as UnsolvedCaseHintLainnya).nama_hint || 'Hint Lainnya'}
                          </p>
                          <p className="text-[10px] text-[#8b7355] mt-0.5">Klik untuk lihat gambar floating</p>
                        </div>
                        <i className="fas fa-chevron-right text-[#c4a882] text-xs group-hover:translate-x-0.5 transition-transform"></i>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => reveal(hint.id)}
                      className="w-full flex items-center justify-between bg-white border border-[#d4c4a8] rounded-xl px-4 py-3 hover:border-[#8b4513]/40 transition-colors text-left group shadow-[0_12px_24px_rgba(92,61,46,0.22)] hover:shadow-[0_18px_30px_rgba(92,61,46,0.32)]"
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
            )
          ) : (
            catHints.map((hint) => (
              <div key={hint.id}>
                {revealed.has(hint.id) ? (
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
              className="relative min-h-[320px] rounded-2xl border-2 border-[#c4a882] p-6 mb-4 overflow-hidden"
              style={{
                backgroundImage: "url('/background_hint.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                boxShadow: 'inset 0 2px 8px rgba(139, 69, 19, 0.08), 0 10px 30px rgba(92, 61, 46, 0.12)',
              }}
            >
              <div
                className={`absolute inset-0 transition-opacity duration-200 ${hoveredHintType ? 'opacity-45' : 'opacity-100'}`}
                style={{
                  backgroundImage: "url('/background_hint.png')",
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4">
                {Object.entries(grouped).map(([tipe, items], idx) => {
                  const hintType = tipe as UnsolvedCaseHintType
                  const cfg = CATEGORY_CONFIG[hintType]
                  const revealedCount = items.filter(h => revealed.has(h.id)).length
                  const isHovered = hoveredHintType === hintType
                  const isAnyHovered = hoveredHintType !== null
                  return (
                    <TiltCard key={tipe}>
                      <button
                        onClick={() => setSelectedCategory(hintType)}
                        onMouseEnter={() => setHoveredHintType(hintType)}
                        onMouseLeave={() => setHoveredHintType(null)}
                        className={`bg-white rounded-2xl border-2 border-[#d4c4a8] p-5 shadow-[0_16px_30px_rgba(92,61,46,0.3)] hover:shadow-[0_0_0_4px_rgba(255,255,255,0.9),0_20px_38px_rgba(92,61,46,0.48)] transition-all duration-200 text-center w-36 ${cfg.rotate} ${isHovered ? 'scale-105 -translate-y-1 opacity-100' : isAnyHovered ? 'opacity-45' : 'opacity-100'}`}
                        style={{
                          marginTop: idx % 2 === 0 ? '12px' : '28px',
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

function BukuCoverPreview({ konten, onOpenBook, onBack }: { konten: UnsolvedCaseHintBuku; onOpenBook: () => void; onBack: () => void }) {
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
    <div className="fixed inset-0 z-50 bg-[#3c2415]/60 backdrop-blur-sm" onClick={onBack}>
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
        <TiltCard>
          <div className={`rounded-[28px] border-2 border-[#c4a882] bg-[#f8f1e5] p-3 shadow-[0_20px_40px_rgba(53,33,18,0.35)] transition-all duration-200 ${zoomed ? 'scale-110' : 'scale-100'}`}>
            <div className="rounded-[20px] border border-[#d4c4a8] bg-white p-2 shadow-inner">
              <img
                src={transformImageUrl(konten.cover_buku)}
                alt={konten.judul_buku}
                className="w-[220px] max-w-[60vw] h-auto rounded-xl object-cover"
              />
            </div>
          </div>
        </TiltCard>
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <button
            onClick={() => setZoomed((prev) => !prev)}
            className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
          >
            <i className={`fas fa-${zoomed ? 'compress' : 'expand'} text-[10px]`}></i>
            {zoomed ? 'Perkecil' : 'Zoom'}
          </button>
          <button
            onClick={onOpenBook}
            className="text-[11px] text-white/90 hover:text-white bg-[#8b4513]/80 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
          >
            <i className="fas fa-book-open text-[10px]"></i>
            Buka Buku
          </button>
          <button
            onClick={onBack}
            className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
          >
            <i className="fas fa-times text-[10px]"></i>
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

function BukuReader({ konten, onClose, onBack, pageIndex, onPageChange }: {
  konten: UnsolvedCaseHintBuku
  onClose: () => void
  onBack: () => void
  pageIndex: number
  onPageChange: (page: number) => void
}) {
  const [flipping, setFlipping] = useState(false)
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev' | null>(null)
  const pages = konten.isi_buku || []
  const currentPage = pages[Math.max(0, Math.min(pageIndex, pages.length - 1))] || konten.cover_buku

  const turnPage = (direction: 'next' | 'prev') => {
    if (flipping) return
    const nextIndex = direction === 'next' ? pageIndex + 1 : pageIndex - 1
    if (nextIndex < 0 || nextIndex >= pages.length) return

    setTurnDirection(direction)
    setFlipping(true)

    window.setTimeout(() => {
      onPageChange(nextIndex)
      setFlipping(false)
      setTurnDirection(null)
    }, 180)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#5c3d2e] bg-white/80 hover:bg-white border border-[#c4a882] rounded-full px-3 py-1.5 shadow-sm"
        >
          <i className="fas fa-arrow-left mr-1"></i>
          Kembali
        </button>
        <div className="text-[11px] font-bold text-[#8b4513] bg-[#e8dcc8] px-3 py-1 rounded-full border border-[#c4a882]">
          {pageIndex + 1} / {pages.length}
        </div>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-[#5c3d2e] bg-white/80 hover:bg-white border border-[#c4a882] rounded-full px-3 py-1.5 shadow-sm"
        >
          <i className="fas fa-times mr-1"></i>
          Tutup Buku
        </button>
      </div>

      <div
        className="relative mx-auto w-full max-w-[420px] rounded-[28px] border-2 border-[#c4a882] bg-[#f2e7d4] p-3 shadow-[0_18px_34px_rgba(92,61,46,0.2)]"
        style={{ perspective: '1200px' }}
      >
        <div className="relative rounded-[22px] border border-[#d4c4a8] bg-[#faf6f0] p-3 shadow-inner">
          <div className="absolute inset-y-0 left-0 w-1/2 rounded-l-[22px] border-r border-[#d4c4a8] bg-gradient-to-r from-white to-[#f5ede3] opacity-80" />
          <div className="absolute inset-y-0 right-0 w-1/2 rounded-r-[22px] border-l border-[#d4c4a8] bg-gradient-to-l from-white to-[#f5ede3] opacity-80" />
          <div className="relative z-10 flex items-center justify-center min-h-[420px] overflow-hidden rounded-[16px] bg-white">
            <img
              src={transformImageUrl(currentPage)}
              alt={`Halaman buku ${pageIndex + 1}`}
              className="max-h-[420px] w-auto object-contain rounded-[12px] transition-transform duration-200"
              style={{
                transform: flipping ? `perspective(1000px) rotateY(${turnDirection === 'next' ? -14 : 14}deg)` : 'perspective(1000px) rotateY(0deg)',
                transformOrigin: turnDirection === 'next' ? 'left center' : 'right center',
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => turnPage('prev')}
          disabled={pageIndex === 0 || flipping}
          className="text-xs font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] disabled:opacity-40 rounded-full px-4 py-2 shadow-[0_10px_20px_rgba(92,61,46,0.24)] transition-all"
        >
          <i className="fas fa-chevron-left mr-1"></i>
          Prev
        </button>
        <button
          onClick={() => turnPage('next')}
          disabled={pageIndex >= pages.length - 1 || flipping}
          className="text-xs font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] disabled:opacity-40 rounded-full px-4 py-2 shadow-[0_10px_20px_rgba(92,61,46,0.24)] transition-all"
        >
          Next
          <i className="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  )
}

function KarakterPreviewPopup({ konten, onOpenGallery, onBack }: { konten: UnsolvedCaseHintKarakter; onOpenGallery: () => void; onBack: () => void }) {
  const avatar = konten.foto_karakter ? transformImageUrl(konten.foto_karakter) : ''

  return (
    <div className="fixed inset-0 z-50 bg-[#3c2415]/60 backdrop-blur-sm" onClick={onBack}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,760px)] rounded-[32px] border-2 border-[#c4a882] bg-[#f8f1e5] p-4 shadow-[0_24px_50px_rgba(53,33,18,0.4)]" onClick={(e) => e.stopPropagation()}>
        <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)] items-start">
          <div className="rounded-[24px] border-2 border-[#c4a882] bg-white p-3 shadow-inner">
            <div className="rounded-[18px] overflow-hidden bg-[#efe4d0] aspect-[4/5] border border-[#d4c4a8]">
              {avatar ? (
                <img src={avatar} alt={konten.nama || 'Karakter'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8b7355]">
                  <i className="fas fa-user text-4xl"></i>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#d4c4a8] bg-[#fffdf8] p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8b7355]">Surat Petunjuk</p>
              <h3 className="font-bold text-[#3c2415] text-2xl mt-2">{konten.nama || 'Guest Logo'}</h3>
              <p className="text-sm text-[#5c3d2e] mt-2 leading-relaxed">
                baca kesaksian dari karakter ini yang didapat dari hasil interogasi
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onOpenGallery}
                className="text-[11px] text-white/90 hover:text-white bg-[#8b4513]/80 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
              >
                <i className="fas fa-images text-[10px]"></i>
                Buka Kesaksian
              </button>
              <button
                onClick={onBack}
                className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
              >
                <i className="fas fa-times text-[10px]"></i>
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FloatingGalleryPopup({ title, images, onClose, mode = 'carousel' }: { title: string; images: string[]; onClose: () => void; mode?: 'carousel' | 'stacked' }) {
  const [zoomed, setZoomed] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const safeImages = images.length > 0 ? images : ['/card_detektif.png']
  const currentImage = safeImages[activeIndex] || safeImages[0]
  const stackedPositions = safeImages.map((_, idx) => ({
    left: `${8 + ((idx * 24) % 64)}%`,
    top: `${8 + ((idx * 18) % 50)}%`,
    rotate: `${-7 + ((idx * 10) % 15)}deg`,
  }))

  const handleZoomToggle = () => {
    setZoomed((prev) => !prev)
    setActiveIndex(0)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#3c2415]/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[30px] border-2 border-[#c4a882] bg-[#f8f1e5]/95 p-4 shadow-[0_24px_50px_rgba(53,33,18,0.5)] ${zoomed ? 'w-[min(98vw,1600px)] h-[min(96vh,920px)]' : 'w-[min(94vw,980px)]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!zoomed ? (
          <>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8b7355]">Floating Gallery</p>
                <p className="font-bold text-[#3c2415]">{title}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleZoomToggle}
                  className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
                >
                  <i className={`fas fa-${zoomed ? 'compress' : 'expand'} text-[10px]`}></i>
                  {zoomed ? 'Perkecil' : 'Zoom'}
                </button>
                <button
                  onClick={onClose}
                  className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
                >
                  <i className="fas fa-times text-[10px]"></i>
                  Tutup
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#d4c4a8] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(244,234,220,0.95))] p-4 shadow-inner">
              {mode === 'stacked' ? (
                <div className="relative min-h-[58vh] overflow-hidden rounded-[18px] border border-[#d4c4a8] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(244,234,220,0.95))]">
                  {safeImages.map((img, idx) => (
                    <TiltCard
                      key={`${img}-${idx}`}
                      className="absolute"
                      style={{ left: stackedPositions[idx].left, top: stackedPositions[idx].top, position: 'absolute' }}
                    >
                      <div
                        className="rounded-[18px] border-2 border-[#c4a882] bg-white p-2 shadow-[0_18px_34px_rgba(92,61,46,0.2)] transition-all duration-200 hover:scale-[1.08]"
                        style={{ transform: `rotate(${stackedPositions[idx].rotate})` }}
                      >
                        <img
                          src={transformImageUrl(img)}
                          alt={`${title} ${idx + 1}`}
                          className="w-[160px] max-w-[32vw] h-auto rounded-[12px] object-cover"
                        />
                      </div>
                    </TiltCard>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center min-h-[52vh]">
                  <img
                    src={transformImageUrl(currentImage)}
                    alt={`${title} ${activeIndex + 1}`}
                    className="max-h-[70vh] w-auto rounded-[18px] object-contain shadow-[0_18px_34px_rgba(92,61,46,0.24)]"
                  />
                </div>
              )}

              {mode === 'carousel' && safeImages.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    onClick={() => setActiveIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1))}
                    className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] rounded-full px-3 py-1.5"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] font-bold text-[#8b4513] bg-[#e8dcc8] px-3 py-1 rounded-full border border-[#c4a882]">
                    {activeIndex + 1} / {safeImages.length}
                  </span>
                  <button
                    onClick={() => setActiveIndex((prev) => (prev + 1) % safeImages.length)}
                    className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] rounded-full px-3 py-1.5"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative w-full h-full rounded-[24px] border border-[#d4c4a8] bg-[#f8f1e5] overflow-hidden">
            <div className="absolute top-3 right-3 z-10 flex gap-2 flex-wrap">
              <button
                onClick={handleZoomToggle}
                className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
              >
                <i className="fas fa-compress text-[10px]"></i>
                Kecilkan
              </button>
              <button
                onClick={onClose}
                className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
              >
                <i className="fas fa-times text-[10px]"></i>
                Tutup
              </button>
            </div>

            <div className="flex items-center justify-center w-full h-full p-3">
              <img
                src={transformImageUrl(currentImage)}
                alt={`${title} full`}
                className="max-w-full max-h-[calc(100vh-80px)] w-auto h-auto object-contain rounded-[18px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ChatPhonePopup({ konten, onClose, pageIndex, onPageChange }: {
  konten: UnsolvedCaseHintChat
  onClose: () => void
  pageIndex: number
  onPageChange: (page: number) => void
}) {
  const [detailMode, setDetailMode] = useState(false)
  const pages = konten.images || []
  const currentImage = pages[Math.max(0, Math.min(pageIndex, pages.length - 1))] || '/card_detektif.png'
  const contactName = konten.nama_lawan_chat || konten.judul_hint || 'Kontak'

  return (
    <div className="fixed inset-0 z-50 bg-[#3c2415]/60 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,980px)]" onClick={(e) => e.stopPropagation()}>
        {!detailMode ? (
          <div className="mx-auto w-[min(90vw,360px)] rounded-[36px] border-[8px] border-[#22160c] bg-[#0f172a] p-2 shadow-[0_24px_50px_rgba(53,33,18,0.45)]">
            <div className="rounded-[28px] overflow-hidden border border-[#374151] bg-[#0f172a]">
              <div className="flex items-center gap-2 bg-[#0f172a] px-3 py-2 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><i className="fas fa-user text-[11px]"></i></div>
                <div>
                  <p className="font-bold text-[12px]">{contactName}</p>
                </div>
              </div>
              <div className="bg-[#0f172a] p-1">
                <img src={transformImageUrl(currentImage)} alt={`Chat ${pageIndex + 1}`} className="w-full h-auto max-h-[420px] object-contain rounded-[18px] bg-[#111827]" />
              </div>
              <div className="flex justify-center gap-2 p-3 bg-[#0f172a]">
                <button
                  onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                  className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] disabled:opacity-40 rounded-full px-3 py-1.5"
                >
                  Prev
                </button>
                <button
                  onClick={() => onPageChange(Math.min(pages.length - 1, pageIndex + 1))}
                  disabled={pageIndex >= pages.length - 1}
                  className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] disabled:opacity-40 rounded-full px-3 py-1.5"
                >
                  Next
                </button>
                <button
                  onClick={() => setDetailMode(true)}
                  className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] rounded-full px-3 py-1.5"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[30px] border-2 border-[#c4a882] bg-[#f8f1e5] p-4 shadow-[0_24px_50px_rgba(53,33,18,0.5)]">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8b7355]">Lihat Detail</p>
                <p className="font-bold text-[#3c2415]">{contactName}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDetailMode(false)}
                  className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
                >
                  <i className="fas fa-arrow-left text-[10px]"></i>
                  Kembali
                </button>
                <button
                  onClick={onClose}
                  className="text-[11px] text-white/90 hover:text-white bg-[#3c2415]/70 backdrop-blur-sm px-4 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1 shadow-md"
                >
                  <i className="fas fa-times text-[10px]"></i>
                  Tutup
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[#d4c4a8] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(244,234,220,0.95))] p-4 shadow-inner">
              <div className="flex items-center justify-center min-h-[52vh]">
                <img
                  src={transformImageUrl(currentImage)}
                  alt={`Chat detail ${pageIndex + 1}`}
                  className="max-h-[70vh] w-auto rounded-[18px] object-contain shadow-[0_18px_34px_rgba(92,61,46,0.24)]"
                />
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
                  disabled={pageIndex === 0}
                  className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] disabled:opacity-40 rounded-full px-3 py-1.5"
                >
                  Prev
                </button>
                <button
                  onClick={() => onPageChange(Math.min(pages.length - 1, pageIndex + 1))}
                  disabled={pageIndex >= pages.length - 1}
                  className="text-[10px] font-bold text-white bg-[#8b4513] hover:bg-[#6b3410] disabled:opacity-40 rounded-full px-3 py-1.5"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KarakterContent({ konten }: { konten: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {konten.foto_karakter ? (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c4a882] shrink-0 bg-[#e8dcc8]">
            <img src={transformImageUrl(konten.foto_karakter)} alt={konten.nama} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#c4a882] shrink-0 bg-[#e8dcc8] flex items-center justify-center">
            <i className="fas fa-user text-[#8b7355]"></i>
          </div>
        )}
        <p className="font-bold">{konten.nama || 'Guest Logo'}</p>
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
