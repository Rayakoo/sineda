'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FileUploader from '@/app/components/admin/FileUploader'
import TtsGridEditor, { type TtsCellData } from '@/app/components/admin/TtsGridEditor'
import FindWordGridEditor, { type FindWordItem } from '@/app/components/admin/FindWordGridEditor'
import { buildRandomFillGrid } from '@/lib/grid-utils'
import { getNextGlobalUrutanAndIncrement } from '@/services/courses'
import {
  getMinigameById, getTtsClues, getFindWords, getTrueFalseItems,
  getDrawings, getFillBlanks, getMatchPairs,
  createCourseMinigame, updateCourseMinigame,
  saveTtsClues, saveTrueFalseItems,
  saveDrawings, saveFillBlanks, saveMatchPairs,
  deleteCourseMinigame,
  MINIGAME_TYPE_LABELS, MINIGAME_TYPE_ICONS,
  type CourseMinigame, type MinigameType,
  type TrueFalseItem,
  type Drawing,
  type FillBlank,
  type MatchPairItem,
} from '@/services/course-minigames'
import ConfirmModal from '@/app/components/ConfirmModal'

export default function MinigameForm({
  courseId,
  minigameId,
  isNew,
}: {
  courseId: string
  minigameId?: string
  isNew: boolean
}) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<MinigameType>('tts')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [gridCells, setGridCells] = useState<TtsCellData[]>([])
  const [ttsClues, setTtsClues] = useState<{ number: number; question: string; answer: string; explanation: string; row: number; col: number; direction: 'across' | 'down' }[]>([])
  const [gridEditorKey, setGridEditorKey] = useState(0)

  const [findWords, setFindWords] = useState<FindWordItem[]>([])
  const [gridWidth, setGridWidth] = useState(10)
  const [gridHeight, setGridHeight] = useState(10)

  const [tfQuestion, setTfQuestion] = useState('')
  const [tfItems, setTfItems] = useState<TrueFalseItem[]>([])

  const [drawings, setDrawings] = useState<Omit<Drawing, 'id' | 'minigame_id' | 'created_at'>[]>([])

  const [fillBlanks, setFillBlanks] = useState<Omit<FillBlank, 'id' | 'minigame_id' | 'created_at'>[]>([])

  const [matchPairs, setMatchPairs] = useState<{
    question: string
    pair_count: number
    items: Omit<MatchPairItem, 'id' | 'match_pairs_id' | 'created_at'>[]
  }[]>([])

  const [nextUrutan, setNextUrutan] = useState(1)
  const [loaded, setLoaded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!isNew) return
    getNextGlobalUrutanAndIncrement(courseId).then(setNextUrutan).catch(() => {})
  }, [courseId, isNew])

  useEffect(() => {
    if (isNew) {
      setLoading(false)
      setLoaded(true)
      return
    }
    if (!minigameId) return
    Promise.all([
      getMinigameById(minigameId),
      getTtsClues(minigameId),
      getFindWords(minigameId),
      getTrueFalseItems(minigameId),
      getDrawings(minigameId),
      getFillBlanks(minigameId),
      getMatchPairs(minigameId),
    ])
      .then(([mg, tts, fw, tf, dw, fb, mp]) => {
        setTitle(mg.title)
        setType(mg.type)
        let loadedSettingsWords = false
        if (mg.settings && typeof mg.settings === 'object') {
          const s = mg.settings as Record<string, unknown>
          if (s.grid_width) setGridWidth(Number(s.grid_width))
          if (s.grid_height) setGridHeight(Number(s.grid_height))
          if (s.words && Array.isArray(s.words) && s.words.length > 0) {
            loadedSettingsWords = true
            setFindWords((s.words as any[]).map((w: any, i: number) => ({
              id: `l_${i}`,
              question: w.question || '',
              answer: w.answer || '',
              explanation: w.explanation || '',
              row: w.row ?? 0,
              col: w.col ?? 0,
              direction: (w.direction as 'across' | 'down') || 'across',
            })))
          }
        }
        if (!loadedSettingsWords && fw.length > 0) {
          setFindWords(fw.map(({ id, minigame_id, ...rest }, i) => ({
            id: `lk_${i}`,
            question: rest.question || '',
            answer: rest.answer || '',
            explanation: rest.explanation || '',
            row: 0,
            col: 0,
            direction: 'across' as const,
          })))
        }
        if (tts.length > 0) {
          const cellsMap = new Map<string, TtsCellData>()
          for (const clue of tts) {
            for (let i = 0; i < clue.answer.length; i++) {
              const r = clue.direction === 'across' ? clue.row : clue.row + i
              const c = clue.direction === 'across' ? clue.col + i : clue.col
              const id = `r${r}c${c}`
              if (!cellsMap.has(id)) {
                cellsMap.set(id, { id, row: r, col: c, letter: clue.answer[i], clues: [] })
              }
            }
          }
          for (const clue of tts) {
            const id = `r${clue.row}c${clue.col}`
            const cell = cellsMap.get(id)
            if (cell && !cell.clues.some(c => c.direction === clue.direction)) {
              cell.clues.push({
                number: clue.number,
                direction: clue.direction,
                question: clue.question,
                answer: clue.answer,
                explanation: clue.explanation || '',
              })
            }
          }
          setGridCells(Array.from(cellsMap.values()))
          setGridEditorKey(prev => prev + 1)
        }
        setTfQuestion(tf[0]?.question || '')
        setTfItems(tf[0]?.items || [])
        setDrawings(dw.map(({ id, minigame_id, ...rest }) => rest))
        setFillBlanks(fb.map(({ id, minigame_id, ...rest }) => ({ ...rest, answers: typeof rest.answers === 'string' ? JSON.parse(rest.answers) : rest.answers })))
        setMatchPairs(mp.map(({ id, minigame_id, items, ...rest }) => ({
          ...rest,
          items: items.map(({ id, match_pairs_id, ...i }) => i),
        })))
      })
      .catch(() => router.push(`/admin/course/${courseId}`))
      .finally(() => { setLoading(false); setLoaded(true) })
  }, [minigameId, isNew, courseId, router])

  const handleSave = async () => {
    if (saving) return
    if (!title) { alert('Judul minigame wajib diisi.'); return }
    setSaving(true)
    try {
      let mg: CourseMinigame
      if (isNew) {
        mg = await createCourseMinigame({ course_id: courseId, title, type, urutan: nextUrutan })
      } else {
        await updateCourseMinigame(minigameId!, { title, type })
        mg = await getMinigameById(minigameId!)
      }

      switch (type) {
        case 'tts': {
          if (ttsClues.length === 0) {
            alert('Belum ada clue yang memiliki nomor dan pertanyaan.')
            setSaving(false)
            return
          }
          await saveTtsClues(mg.id, ttsClues)
          break
        }
        case 'find_the_word':
          await updateCourseMinigame(mg.id, {
            settings: {
              grid_width: gridWidth,
              grid_height: gridHeight,
              words: findWords.map(({ id, ...rest }) => rest),
            },
          })
          break
        case 'true_or_false':
          await saveTrueFalseItems(mg.id, { question: tfQuestion, items: tfItems })
          break
        case 'drawing':
          await saveDrawings(mg.id, drawings)
          break
        case 'fill_the_blank':
          await saveFillBlanks(mg.id, fillBlanks)
          break
        case 'match_pairs':
          await saveMatchPairs(mg.id, matchPairs)
          break
      }

      alert('Minigame berhasil disimpan!')
      router.push(`/admin/course/${courseId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!minigameId) return
    setDeleting(true)
    try {
      await deleteCourseMinigame(minigameId)
      alert('Minigame berhasil dihapus.')
      router.push(`/admin/course/${courseId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus minigame')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-3xl text-[#005696]"></i>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-[#DBEAFE] py-4 px-6 md:px-12 flex items-center justify-between shadow-sm relative">
        <div className="flex flex-col items-center mx-auto text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {isNew ? 'Buat Minigame Baru' : 'Edit Minigame'}
          </span>
          <h1 className="text-base md:text-lg font-bold text-gray-800">{title || 'Minigame'}</h1>
        </div>
        <button
          onClick={() => router.push(`/admin/course/${courseId}`)}
          className="absolute right-6 bg-[#005696] text-white text-xs px-4 py-1.5 rounded-lg hover:bg-[#003d6e] flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-arrow-left text-xs"></i> Kembali
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Judul Minigame</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: TTS Kesehatan Reproduksi"
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#005696] shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Tipe Minigame</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(MINIGAME_TYPE_LABELS) as [MinigameType, string][]).map(([key, label]) => (
                <div
                  key={key}
                  onClick={() => setType(key)}
                  className={`border-2 rounded-xl p-3 cursor-pointer transition-all ${
                    type === key ? 'border-[#005696] bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`fas ${MINIGAME_TYPE_ICONS[key]} text-lg ${type === key ? 'text-[#005696]' : 'text-gray-400'}`}></i>
                    <h4 className="font-bold text-sm text-gray-800">{label}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {type === 'tts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-800">Editor Grid TTS</h3>
                <p className="text-xs text-gray-400">Klik (+) untuk menambah kotak, klik kotak untuk edit huruf &amp; clue</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <TtsGridEditor
                  key={gridEditorKey}
                  initialCells={gridCells.length > 0 ? gridCells : undefined}
                  onChange={(clues) => setTtsClues(clues)}
                />
              </div>
            </div>
          )}

          {type === 'find_the_word' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Dimensi Grid</h3>
                <p className="text-xs text-gray-400">Ukuran grid berlaku untuk semua kata dalam minigame ini.</p>
                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  <div>
                    <label className="text-xs text-gray-500">Lebar</label>
                    <input type="number" value={gridWidth} onChange={(e) => setGridWidth(parseInt(e.target.value) || 10)} min={5} max={30} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Tinggi</label>
                    <input type="number" value={gridHeight} onChange={(e) => setGridHeight(parseInt(e.target.value) || 10)} min={5} max={30} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <FindWordGridEditor
                  key={`${gridWidth}x${gridHeight}-${findWords.length}`}
                  gridWidth={gridWidth}
                  gridHeight={gridHeight}
                  initialWords={findWords}
                  onChange={(words) => setFindWords(words)}
                />
              </div>
            </div>
          )}

          {type === 'true_or_false' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Pertanyaan</label>
                <input
                  type="text"
                  value={tfQuestion}
                  onChange={(e) => setTfQuestion(e.target.value)}
                  placeholder="Contoh: Pilih Benar atau Salah untuk pernyataan berikut"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#005696] shadow-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-800">Daftar Item Benar/Salah</h3>
                <button
                  type="button"
                  onClick={() => setTfItems([...tfItems, { image_url: '', title: '', answer: true, explanation: '' }])}
                  className="inline-flex items-center gap-1 bg-[#005696] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#003d6e]"
                >
                  <i className="fas fa-plus text-xs"></i> Tambah Item
                </button>
              </div>
              {tfItems.map((item, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Item #{i + 1}</span>
                    <button type="button" onClick={() => setTfItems(tfItems.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Judul / Pernyataan</label>
                    <input type="text" value={item.title} onChange={(e) => { const c = [...tfItems]; c[i] = { ...c[i], title: e.target.value }; setTfItems(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500">URL Gambar (opsional)</label>
                      <div className="flex gap-2">
                        <input type="url" value={item.image_url || ''} onChange={(e) => { const c = [...tfItems]; c[i] = { ...c[i], image_url: e.target.value }; setTfItems(c); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        <FileUploader onUploadComplete={(url) => { const c = [...tfItems]; c[i] = { ...c[i], image_url: url }; setTfItems(c); }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Jawaban</label>
                      <select value={item.answer ? 'true' : 'false'} onChange={(e) => { const c = [...tfItems]; c[i] = { ...c[i], answer: e.target.value === 'true' }; setTfItems(c); }} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                        <option value="true">Benar</option>
                        <option value="false">Salah</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Penjelasan (opsional)</label>
                    <input type="text" value={item.explanation || ''} onChange={(e) => { const c = [...tfItems]; c[i] = { ...c[i], explanation: e.target.value }; setTfItems(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'drawing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-800">Daftar Gambar</h3>
                <button
                  type="button"
                  onClick={() => setDrawings([...drawings, { question: '', base_image_url: '' }])}
                  className="inline-flex items-center gap-1 bg-[#005696] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#003d6e]"
                >
                  <i className="fas fa-plus text-xs"></i> Tambah
                </button>
              </div>
              {drawings.map((dw, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Item #{i + 1}</span>
                    <button type="button" onClick={() => setDrawings(drawings.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Soal</label>
                    <input type="text" value={dw.question} onChange={(e) => { const c = [...drawings]; c[i] = { ...c[i], question: e.target.value }; setDrawings(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">URL Gambar Dasar (base image)</label>
                    <div className="flex gap-2">
                      <input type="url" value={dw.base_image_url || ''} onChange={(e) => { const c = [...drawings]; c[i] = { ...c[i], base_image_url: e.target.value }; setDrawings(c); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                      <FileUploader onUploadComplete={(url) => { const c = [...drawings]; c[i] = { ...c[i], base_image_url: url }; setDrawings(c); }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'fill_the_blank' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-800">Daftar Soal Isian</h3>
                <button
                  type="button"
                  onClick={() => setFillBlanks([...fillBlanks, { image_url: '', question: '', answer_count: 1, answers: [''], explanation: '' }])}
                  className="inline-flex items-center gap-1 bg-[#005696] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#003d6e]"
                >
                  <i className="fas fa-plus text-xs"></i> Tambah Soal
                </button>
              </div>
              {fillBlanks.map((fb, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Soal #{i + 1}</span>
                    <button type="button" onClick={() => setFillBlanks(fillBlanks.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">URL Gambar (opsional)</label>
                    <div className="flex gap-2">
                      <input type="url" value={fb.image_url || ''} onChange={(e) => { const c = [...fillBlanks]; c[i] = { ...c[i], image_url: e.target.value }; setFillBlanks(c); }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                      <FileUploader onUploadComplete={(url) => { const c = [...fillBlanks]; c[i] = { ...c[i], image_url: url }; setFillBlanks(c); }} />
                    </div>
                    {fb.image_url && (
                      <div className="mt-2">
                        <img src={fb.image_url} alt="" className="w-full max-w-sm rounded-xl border border-gray-200 bg-gray-50" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Soal</label>
                    <input type="text" value={fb.question} onChange={(e) => { const c = [...fillBlanks]; c[i] = { ...c[i], question: e.target.value }; setFillBlanks(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Jumlah Jawaban</label>
                    <input type="number" value={fb.answer_count} onChange={(e) => { const cnt = parseInt(e.target.value) || 1; const c = [...fillBlanks]; const answers = c[i].answers; while (answers.length < cnt) answers.push(''); c[i] = { ...c[i], answer_count: cnt, answers: answers.slice(0, cnt) }; setFillBlanks(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Jawaban</label>
                    <div className="flex flex-wrap gap-2">
                      {fb.answers.map((ans, ai) => (
                        <input key={ai} type="text" value={ans} onChange={(e) => { const c = [...fillBlanks]; c[i].answers[ai] = e.target.value; setFillBlanks(c); }} placeholder={`Jawaban ${ai + 1}`} className="flex-1 min-w-[100px] max-w-[160px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Penjelasan (opsional)</label>
                    <input type="text" value={fb.explanation || ''} onChange={(e) => { const c = [...fillBlanks]; c[i] = { ...c[i], explanation: e.target.value }; setFillBlanks(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {type === 'match_pairs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-800">Daftar Pasangan</h3>
                <button
                  type="button"
                  onClick={() => setMatchPairs([...matchPairs, { question: '', pair_count: 2, items: [{ pair_code: 'A', image_url: '', card_title: '' }, { pair_code: 'A', image_url: '', card_title: '' }] }])}
                  className="inline-flex items-center gap-1 bg-[#005696] text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-[#003d6e]"
                >
                  <i className="fas fa-plus text-xs"></i> Tambah Set
                </button>
              </div>
              {matchPairs.map((mp, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500">Set #{i + 1}</span>
                    <button type="button" onClick={() => setMatchPairs(matchPairs.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Soal</label>
                    <input type="text" value={mp.question} onChange={(e) => { const c = [...matchPairs]; c[i] = { ...c[i], question: e.target.value }; setMatchPairs(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Jumlah Pasangan</label>
                    <input type="number" value={mp.pair_count} onChange={(e) => { const cnt = parseInt(e.target.value) || 1; const c = [...matchPairs]; const items = c[i].items; const codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; while (items.length < cnt * 2) { const code = codes[Math.floor(items.length / 2)]; items.push({ pair_code: code, image_url: '', card_title: '' }); } c[i] = { ...c[i], pair_count: cnt, items: items.slice(0, cnt * 2) }; setMatchPairs(c); }} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mp.items.map((item, ii) => (
                      <div key={ii} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-100">
                        <span className="text-xs font-bold text-gray-500">Card {ii + 1} — Kode: {item.pair_code}</span>
                        <div>
                          <label className="text-xs text-gray-500">URL Gambar (opsional)</label>
                          <div className="flex gap-2">
                            <input type="url" value={item.image_url || ''} onChange={(e) => { const c = [...matchPairs]; c[i].items[ii] = { ...c[i].items[ii], image_url: e.target.value }; setMatchPairs(c); }} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                            <FileUploader onUploadComplete={(url) => { const c = [...matchPairs]; c[i].items[ii] = { ...c[i].items[ii], image_url: url }; setMatchPairs(c); }} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Judul Card</label>
                          <input type="text" value={item.card_title} onChange={(e) => { const c = [...matchPairs]; c[i].items[ii] = { ...c[i].items[ii], card_title: e.target.value }; setMatchPairs(c); }} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-6 py-3.5 bg-white text-[#005696] font-bold rounded-2xl border-2 border-[#005696] hover:bg-blue-50 flex items-center gap-2 shadow-md transition-all text-sm"
            >
              <i className="fas fa-eye"></i> Preview
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-10 py-3.5 bg-[#005696] text-white font-bold rounded-2xl hover:bg-[#003d6e] flex items-center gap-2 shadow-md transition-all text-sm disabled:opacity-50"
            >
              <i className={`fas ${saving ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
              {saving ? 'Menyimpan...' : 'Simpan Minigame'}
            </button>
            {!isNew && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className="px-6 py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 flex items-center gap-2 shadow-md transition-all text-sm disabled:opacity-50"
              >
                <i className={`fas ${deleting ? 'fa-spinner fa-spin' : 'fa-trash'}`}></i>
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            )}
          </div>

          {showPreview && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
              <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
                  <div>
                    <h2 className="font-bold text-lg text-gray-800">{title || 'Minigame'}</h2>
                    <p className="text-xs text-gray-400">{MINIGAME_TYPE_LABELS[type]}</p>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {type === 'tts' && (
                    <div className="space-y-6">
                      {gridCells.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada cell di grid.</p>
                      ) : (
                        <>
                          <div className="w-full max-w-full overflow-x-auto pb-2">
                            {(() => {
                              const minR = Math.min(...gridCells.map(c => c.row))
                              const maxR = Math.max(...gridCells.map(c => c.row))
                              const minC = Math.min(...gridCells.map(c => c.col))
                              const maxC = Math.max(...gridCells.map(c => c.col))
                              const rows = maxR - minR + 1
                              const cols = maxC - minC + 1
                              const cellMap = new Map(gridCells.map(c => [c.id, c]))
                              return (
                                <div className="inline-grid gap-[2px] bg-slate-900 rounded-md p-[2px] shadow-lg" style={{ gridTemplateColumns: `repeat(${cols}, 32px)` }}>
                                  {Array.from({ length: rows }, (_, ri) =>
                                    Array.from({ length: cols }, (_, ci) => {
                                      const r = minR + ri, c = minC + ci
                                      const cell = cellMap.get(`r${r}c${c}`)
                                      if (!cell) return <div key={`${r}-${c}`} className="w-8 h-8 bg-slate-900" />
                                      return (
                                        <div key={`${r}-${c}`} className="relative w-8 h-8">
                                          <div className="w-full h-full bg-white border border-slate-300 flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-800">{cell.letter || '.'}</span>
                                          </div>
                                          {cell.clues.length === 1 && (
                                            <span className="absolute top-[1px] left-[2px] text-[7px] font-bold text-slate-500 pointer-events-none select-none leading-none">
                                              {cell.clues[0].number}
                                            </span>
                                          )}
                                          {cell.clues.length >= 2 && (
                                            <span className="absolute top-0 left-0.5 text-[6px] font-bold text-slate-500 pointer-events-none select-none leading-tight text-left">
                                              {cell.clues.slice(0, 2).map(c => c.number).join(',')}
                                            </span>
                                          )}
                                        </div>
                                      )
                                    })
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#005696]/60 mb-2">Mendatar</h4>
                              {ttsClues.filter(c => c.direction === 'across').map(c => (
                                <div key={c.number} className="bg-blue-50 rounded-xl p-3 mb-2">
                                  <span className="text-xs font-bold text-[#005696]">{c.number}. </span>
                                  <span className="text-xs text-gray-700">{c.question}</span>
                                  <p className="text-[10px] text-[#005696]/50 mt-0.5">{c.answer}</p>
                                </div>
                              ))}
                              {ttsClues.filter(c => c.direction === 'across').length === 0 && (
                                <p className="text-xs text-gray-400 italic">Tidak ada clue mendatar.</p>
                              )}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#005696]/60 mb-2">Menurun</h4>
                              {ttsClues.filter(c => c.direction === 'down').map(c => (
                                <div key={c.number} className="bg-blue-50 rounded-xl p-3 mb-2">
                                  <span className="text-xs font-bold text-[#005696]">{c.number}. </span>
                                  <span className="text-xs text-gray-700">{c.question}</span>
                                  <p className="text-[10px] text-[#005696]/50 mt-0.5">{c.answer}</p>
                                </div>
                              ))}
                              {ttsClues.filter(c => c.direction === 'down').length === 0 && (
                                <p className="text-xs text-gray-400 italic">Tidak ada clue menurun.</p>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {type === 'find_the_word' && (
                    <div className="space-y-4">
                      {(() => {
                        const filledGrid = buildRandomFillGrid(
                          gridWidth,
                          gridHeight,
                          findWords.map(w => ({ answer: w.answer, row: w.row, col: w.col, direction: w.direction }))
                        )
                        return (
                          <div className="w-full max-w-full overflow-x-auto">
                            <div
                              className="inline-grid gap-[2px] bg-slate-900 rounded-md p-[2px] shadow-lg"
                              style={{ gridTemplateColumns: `repeat(${gridWidth}, 28px)` }}
                            >
                              {filledGrid.map((row, ri) =>
                                row.map((cell, ci) => (
                                  <div
                                    key={`${ri}_${ci}`}
                                    className={`w-7 h-7 border flex items-center justify-center text-[10px] font-bold uppercase ${
                                      cell.isAnswer
                                        ? 'border-[#005696] bg-white text-[#005696]'
                                        : 'border-slate-200 bg-gray-50 text-gray-500'
                                    }`}
                                  >
                                    {cell.char}
                                  </div>
                                ))
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Grid {gridWidth}×{gridHeight}</p>
                          </div>
                        )
                      })()}
                      {findWords.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada kata.</p>
                      ) : (
                        findWords.map((fw) => (
                          <div key={fw.id} className="bg-blue-50 rounded-2xl p-4">
                            <p className="text-sm font-bold text-gray-800">{fw.question}</p>
                            <p className="text-xs text-[#005696]/60 mt-1">
                              {fw.direction === 'across' ? 'Mendatar' : 'Menurun'} · posisi ({fw.row}, {fw.col}) · Jawaban: {fw.answer}
                            </p>
                            {fw.explanation && <p className="text-xs text-gray-400 mt-1">{fw.explanation}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {type === 'true_or_false' && (
                    <div className="space-y-4">
                      {tfQuestion && <p className="text-sm font-bold text-gray-800">{tfQuestion}</p>}
                      {tfItems.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada item.</p>
                      ) : (
                        tfItems.map((item, i) => (
                          <div key={i} className="bg-blue-50 rounded-2xl p-4 flex items-start gap-4">
                            {item.image_url && (
                              <img src={item.image_url} alt="" className="w-20 h-20 rounded-xl object-contain bg-gray-100 shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-bold text-gray-800">{item.title}</p>
                              <span className={`inline-flex items-center gap-1 text-xs font-bold mt-1 ${item.answer ? 'text-emerald-600' : 'text-red-500'}`}>
                                <i className={`fas ${item.answer ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                {item.answer ? 'Benar' : 'Salah'}
                              </span>
                              {item.explanation && <p className="text-xs text-gray-400 mt-1">{item.explanation}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {type === 'drawing' && (
                    <div className="space-y-4">
                      {drawings.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada gambar.</p>
                      ) : (
                        drawings.map((dw, i) => (
                          <div key={i} className="bg-blue-50 rounded-2xl p-4">
                            <p className="text-sm font-bold text-gray-800 mb-3">{dw.question}</p>
                            {dw.base_image_url && (
                              <img src={dw.base_image_url} alt="" className="w-full max-w-md rounded-xl border border-gray-200" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {type === 'fill_the_blank' && (
                    <div className="space-y-4">
                      {fillBlanks.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada soal.</p>
                      ) : (
                        fillBlanks.map((fb, i) => (
                          <div key={i} className="bg-blue-50 rounded-2xl p-4">
                            <p className="text-sm font-bold text-gray-800 mb-3">{fb.question}</p>
                            {fb.image_url && <img src={fb.image_url} alt="" className="w-full max-w-md rounded-xl border border-gray-200 mb-3" />}
                            <div className="flex flex-wrap gap-2">
                              {fb.answers.map((ans, ai) => (
                                <div key={ai} className="min-w-[100px] bg-white border border-dashed border-gray-300 rounded-lg px-3 py-2 text-center">
                                  <span className="text-xs text-gray-400">{ans || `Jawaban ${ai + 1}`}</span>
                                </div>
                              ))}
                            </div>
                            {fb.explanation && <p className="text-xs text-gray-400 mt-2">{fb.explanation}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {type === 'match_pairs' && (
                    <div className="space-y-4">
                      {matchPairs.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Belum ada set pasangan.</p>
                      ) : (
                        matchPairs.map((mp, i) => (
                          <div key={i} className="bg-blue-50 rounded-2xl p-4">
                            <p className="text-sm font-bold text-gray-800 mb-4">{mp.question}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {mp.items.map((item, ii) => (
                                <div key={ii} className="bg-white rounded-xl p-3 border border-gray-200 text-center">
                                  {item.image_url && (
                                    <img src={item.image_url} alt="" className="w-full h-20 object-contain bg-gray-50 rounded-lg mb-2" />
                                  )}
                                  <p className="text-xs font-bold text-gray-700">{item.card_title}</p>
                                  <span className="text-[10px] text-gray-400">Kode: {item.pair_code}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Hapus Minigame"
          message="Apakah Anda yakin ingin menghapus minigame ini? Tindakan ini tidak dapat dibatalkan."
          confirmLabel={deleting ? 'Menghapus...' : 'Hapus'}
          confirmClass="bg-red-600 hover:bg-red-700"
          icon="fa-trash"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  )
}
