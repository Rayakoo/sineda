'use client'

import { useParams } from 'next/navigation'
import { getDetectiveName, getConfirmed } from '@/lib/unsolvedCaseStorage'
import type { UnsolvedCaseItem } from '@/types/course'
import { getCourse } from '@/services/courses'
import { getUnsolvedCase } from '@/services/unsolvedCase'
import { useState, useEffect, useRef, useCallback } from 'react'

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

export default function FilesPage() {
  const params = useParams()
  const courseId = params?.id as string
  const [peraturan, setPeraturan] = useState<UnsolvedCaseItem[]>([])
  const [instruksi, setInstruksi] = useState<UnsolvedCaseItem[]>([])
  const [ready, setReady] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    const name = getDetectiveName()
    const confirmed = getConfirmed()
    if (!name || !confirmed) { setDenied(true); setReady(true); return }

    getCourse(courseId).then((c) => {
      if (!c) return
      getUnsolvedCase(c.id).then((uc) => {
        if (uc) {
          setPeraturan(uc.peraturan || [])
          setInstruksi(uc.instruksi || [])
        }
        setReady(true)
      })
    })
  }, [courseId])

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

  return (
    <div className="bg-[#f5efe6] rounded-2xl shadow-md border border-[#c4a882] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(139, 69, 19, 0.08)' }}
    >
      <div className="bg-[#8b4513] text-white px-5 py-3 flex items-center gap-2">
        <i className="fas fa-folder-open text-sm"></i>
        <h2 className="font-bold text-sm uppercase tracking-wider">Berkas Kasus</h2>
        <span className="text-xs text-[#e8dcc8] ml-auto font-mono">{peraturan.length + instruksi.length} item</span>
      </div>
      <div className="p-4 md:p-5">
        <style>{`
          @keyframes cardFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
          }
        `}</style>
        {peraturan.length === 0 && instruksi.length === 0 ? (
          <p className="text-sm text-[#a09080] italic text-center py-6">Belum ada berkas.</p>
        ) : (
          <div className="space-y-6">
            {peraturan.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold text-[#8b7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-gavel text-[#8b4513]"></i>
                  Peraturan Permainan
                </h3>
                <div className="space-y-4">
                  {peraturan.map((item, i) =>
                    item.type === 'image' ? (
                      <TiltCard key={i} className="max-w-md mx-auto">
                        <div className="relative">
                          <div className="absolute top-2 left-2 bg-[#8b4513]/90 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded z-10 uppercase tracking-wider">
                            Peraturan #{i + 1}
                          </div>
                          <img
                            src={item.content}
                            alt={`Peraturan ${i + 1}`}
                            className="w-full h-auto rounded-xl shadow-md border-2 border-[#c4a882]"
                            style={{
                              animation: 'cardFloat 4s ease-in-out infinite',
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      </TiltCard>
                    ) : (
                      <TiltCard key={i}>
                        <div className="bg-white rounded-xl border-2 border-[#d4c4a8] p-4 relative min-h-[100px] flex flex-col shadow-sm">
                          <div className="bg-[#5c3d2e]/90 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded self-start uppercase tracking-wider">
                            Peraturan #{i + 1}
                          </div>
                          <div className="flex-1 flex items-center mt-3">
                            <div className="flex items-start gap-3">
                              <i className="fas fa-file-lines text-[#8b4513] mt-0.5 shrink-0"></i>
                              <p className="text-sm text-[#3c2415] leading-relaxed">{item.content}</p>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    )
                  )}
                </div>
              </section>
            )}

            {instruksi.length > 0 && (
              <section>
                <h3 className="text-[11px] font-bold text-[#8b7355] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-clipboard-list text-[#8b4513]"></i>
                  Instruksi
                </h3>
                <div className="space-y-4">
                  {instruksi.map((item, i) =>
                    item.type === 'image' ? (
                      <TiltCard key={i} className="max-w-md mx-auto">
                        <div className="relative">
                          <div className="absolute top-2 left-2 bg-[#8b4513]/90 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded z-10 uppercase tracking-wider">
                            Instruksi #{i + 1}
                          </div>
                          <img
                            src={item.content}
                            alt={`Instruksi ${i + 1}`}
                            className="w-full h-auto rounded-xl shadow-md border-2 border-[#c4a882]"
                            style={{
                              animation: 'cardFloat 4s ease-in-out infinite',
                            }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      </TiltCard>
                    ) : (
                      <TiltCard key={i}>
                        <div className="bg-white rounded-xl border-2 border-[#d4c4a8] p-4 relative min-h-[100px] flex flex-col shadow-sm">
                          <div className="bg-[#5c3d2e]/90 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded self-start uppercase tracking-wider">
                            Instruksi #{i + 1}
                          </div>
                          <div className="flex-1 flex items-center mt-3">
                            <div className="flex items-start gap-3">
                              <i className="fas fa-file-lines text-[#8b4513] mt-0.5 shrink-0"></i>
                              <p className="text-sm text-[#3c2415] leading-relaxed">{item.content}</p>
                            </div>
                          </div>
                        </div>
                      </TiltCard>
                    )
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
