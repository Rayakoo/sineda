'use client'

import { useEffect, useState } from 'react'
import { getHints, createHint, updateHint, deleteHint, updateHintOrder, getNextHintUrutan } from '@/services/unsolvedCase'
import type { UnsolvedCaseHint, UnsolvedCaseHintType } from '@/types/course'
import FileUploader from './FileUploader'

type Props = {
  unsolvedCaseId: string
}

const HINT_TYPES: { value: UnsolvedCaseHintType; label: string; icon: string }[] = [
  { value: 'chat', label: 'Chat / Status', icon: 'fa-comment-dots' },
  { value: 'karakter', label: 'Karakter', icon: 'fa-user' },
  { value: 'buku', label: 'Buku', icon: 'fa-book' },
  { value: 'kartu', label: 'Kartu', icon: 'fa-id-card' },
  { value: 'lainnya', label: 'Lainnya', icon: 'fa-box' },
]

const TYPE_ICONS: Record<string, string> = {
  chat: 'fa-comment-dots text-green-600',
  karakter: 'fa-user text-blue-600',
  buku: 'fa-book text-amber-600',
  kartu: 'fa-id-card text-purple-600',
  lainnya: 'fa-box text-gray-600',
}

type KontenData = Record<string, unknown>

export default function UnsolvedCaseHintsEditor({ unsolvedCaseId }: Props) {
  const [hints, setHints] = useState<UnsolvedCaseHint[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHint, setEditingHint] = useState<UnsolvedCaseHint | null>(null)
  const [saving, setSaving] = useState(false)

  const [formTipe, setFormTipe] = useState<UnsolvedCaseHintType>('chat')
  const [formKonten, setFormKonten] = useState<KontenData>({})

  const loadHints = async () => {
    setLoading(true)
    const data = await getHints(unsolvedCaseId)
    setHints(data)
    setLoading(false)
  }

  useEffect(() => {
    if (unsolvedCaseId) loadHints()
  }, [unsolvedCaseId])

  const openNew = () => {
    setEditingHint(null)
    setFormTipe('chat')
    setFormKonten({})
    setShowModal(true)
  }

  const openEdit = (hint: UnsolvedCaseHint) => {
    setEditingHint(hint)
    setFormTipe(hint.tipe)
    setFormKonten(hint.konten as KontenData)
    setShowModal(true)
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingHint(null)
    setFormTipe('chat')
    setFormKonten({})
  }

  const updateKonten = (key: string, value: unknown) => {
    setFormKonten((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayItem = (key: string, item: string) => {
    const arr: string[] = (formKonten[key] as string[]) || []
    updateKonten(key, arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item])
  }

  const pushArray = (key: string) => {
    const arr: string[] = (formKonten[key] as string[]) || []
    updateKonten(key, [...arr, ''])
  }

  const updateArrayItem = (key: string, index: number, value: string) => {
    const arr: string[] = [...((formKonten[key] as string[]) || [])]
    arr[index] = value
    updateKonten(key, arr)
  }

  const removeArrayItem = (key: string, index: number) => {
    const arr: string[] = (formKonten[key] as string[]) || []
    updateKonten(key, arr.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        tipe: formTipe,
        konten: formKonten,
      }
      if (editingHint) {
        await updateHint(editingHint.id, payload)
      } else {
        const urutan = await getNextHintUrutan(unsolvedCaseId)
        await createHint({ unsolved_case_id: unsolvedCaseId, urutan, ...payload })
      }
      resetForm()
      loadHints()
    } catch {
      alert('Gagal menyimpan hint')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus hint ini?')) return
    try {
      await deleteHint(id)
      loadHints()
    } catch {
      alert('Gagal menghapus hint')
    }
  }

  const moveHint = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= hints.length) return
    const newHints = [...hints]
    const temp = newHints[index]
    newHints[index] = newHints[target]
    newHints[target] = temp
    const updates = newHints.map((h, i) => ({ id: h.id, urutan: i }))
    try {
      await updateHintOrder(updates)
      setHints(newHints)
    } catch {
      alert('Gagal mengubah urutan')
    }
  }

  const renderFormFields = () => {
    switch (formTipe) {
      case 'chat':
        return renderChatFields()
      case 'karakter':
        return renderKarakterFields()
      case 'buku':
        return renderBukuFields()
      case 'kartu':
        return renderKartuFields()
      case 'lainnya':
        return renderLainnyaFields()
    }
  }

  const renderChatFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateKonten('is_chat', true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              formKonten.is_chat ? 'border-[#005696] bg-blue-50 text-[#005696]' : 'border-gray-200 text-gray-600'
            }`}
          >
            <i className="fas fa-comments mr-1"></i> Chat
          </button>
          <button
            type="button"
            onClick={() => updateKonten('is_chat', false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
              formKonten.is_chat === false ? 'border-[#005696] bg-blue-50 text-[#005696]' : 'border-gray-200 text-gray-600'
            }`}
          >
            <i className="fas fa-image mr-1"></i> Bukan Chat
          </button>
        </div>
      </div>
      {formKonten.is_chat ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lawan Chat</label>
          <input
            type="text"
            value={(formKonten.nama_lawan_chat as string) || ''}
            onChange={(e) => updateKonten('nama_lawan_chat', e.target.value)}
            placeholder="Nama lawan chatting"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Hint</label>
          <input
            type="text"
            value={(formKonten.judul_hint as string) || ''}
            onChange={(e) => updateKonten('judul_hint', e.target.value)}
            placeholder="Judul hint"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Gambar</label>
          <button
            type="button"
            onClick={() => pushArray('images')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            <i className="fas fa-plus mr-0.5"></i> Tambah Gambar
          </button>
        </div>
        {((formKonten.images as string[]) || []).map((img, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={img}
                  onChange={(e) => updateArrayItem('images', i, e.target.value)}
                  placeholder="URL gambar"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
                />
                <FileUploader
                  accept="image/*"
                  label="Upload"
                  onUploadComplete={(url) => updateArrayItem('images', i, url)}
                />
              </div>
              {img && (
                <img
                  src={img}
                  alt={`Gambar ${i + 1}`}
                  className="max-h-24 rounded border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeArrayItem('images', i)}
              className="text-red-500 hover:text-red-700 mt-1"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderKarakterFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Karakter</label>
        <input
          type="text"
          value={(formKonten.nama as string) || ''}
          onChange={(e) => updateKonten('nama', e.target.value)}
          placeholder="Nama karakter"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Foto Karakter</label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={(formKonten.foto_karakter as string) || ''}
            onChange={(e) => updateKonten('foto_karakter', e.target.value)}
            placeholder="URL foto karakter"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
          <FileUploader
            accept="image/*"
            label="Upload"
            onUploadComplete={(url) => updateKonten('foto_karakter', url)}
          />
        </div>
        {formKonten.foto_karakter && (
          <img
            src={formKonten.foto_karakter as string}
            alt="Preview karakter"
            className="mt-2 max-h-32 rounded border border-gray-200"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Kesaksian (Gambar)</label>
          <button
            type="button"
            onClick={() => pushArray('images')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            <i className="fas fa-plus mr-0.5"></i> Tambah Gambar
          </button>
        </div>
        {((formKonten.images as string[]) || []).map((img, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={img}
                  onChange={(e) => updateArrayItem('images', i, e.target.value)}
                  placeholder="URL gambar kesaksian"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
                />
                <FileUploader
                  accept="image/*"
                  label="Upload"
                  onUploadComplete={(url) => updateArrayItem('images', i, url)}
                />
              </div>
              {img && (
                <img
                  src={img}
                  alt={`Kesaksian ${i + 1}`}
                  className="max-h-24 rounded border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeArrayItem('images', i)}
              className="text-red-500 hover:text-red-700 mt-1"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBukuFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Judul Buku</label>
        <input
          type="text"
          value={(formKonten.judul_buku as string) || ''}
          onChange={(e) => updateKonten('judul_buku', e.target.value)}
          placeholder="Judul buku"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cover Buku</label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={(formKonten.cover_buku as string) || ''}
            onChange={(e) => updateKonten('cover_buku', e.target.value)}
            placeholder="URL cover buku"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
          <FileUploader
            accept="image/*"
            label="Upload"
            onUploadComplete={(url) => updateKonten('cover_buku', url)}
          />
        </div>
        {formKonten.cover_buku && (
          <img
            src={formKonten.cover_buku as string}
            alt="Preview cover"
            className="mt-2 max-h-32 rounded border border-gray-200"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Isi Buku (Gambar)</label>
          <button
            type="button"
            onClick={() => pushArray('isi_buku')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            <i className="fas fa-plus mr-0.5"></i> Tambah Halaman
          </button>
        </div>
        {((formKonten.isi_buku as string[]) || []).map((img, i) => (
          <div key={i} className="flex items-start gap-2 mb-2">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={img}
                  onChange={(e) => updateArrayItem('isi_buku', i, e.target.value)}
                  placeholder={`URL halaman ${i + 1}`}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
                />
                <FileUploader
                  accept="image/*"
                  label="Upload"
                  onUploadComplete={(url) => updateArrayItem('isi_buku', i, url)}
                />
              </div>
              {img && (
                <img
                  src={img}
                  alt={`Halaman ${i + 1}`}
                  className="max-h-24 rounded border border-gray-200"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeArrayItem('isi_buku', i)}
              className="text-red-500 hover:text-red-700 mt-1"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderKartuFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kartu</label>
        <input
          type="text"
          value={(formKonten.nama_kartu as string) || ''}
          onChange={(e) => updateKonten('nama_kartu', e.target.value)}
          placeholder="Nama kartu"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kartu Bagian Depan</label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={(formKonten.kartu_depan as string) || ''}
            onChange={(e) => updateKonten('kartu_depan', e.target.value)}
            placeholder="URL gambar depan"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
          <FileUploader
            accept="image/*"
            label="Upload"
            onUploadComplete={(url) => updateKonten('kartu_depan', url)}
          />
        </div>
        {formKonten.kartu_depan && (
          <img
            src={formKonten.kartu_depan as string}
            alt="Preview depan"
            className="mt-2 max-h-32 rounded border border-gray-200"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kartu Bagian Belakang</label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={(formKonten.kartu_belakang as string) || ''}
            onChange={(e) => updateKonten('kartu_belakang', e.target.value)}
            placeholder="URL gambar belakang"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
          <FileUploader
            accept="image/*"
            label="Upload"
            onUploadComplete={(url) => updateKonten('kartu_belakang', url)}
          />
        </div>
        {formKonten.kartu_belakang && (
          <img
            src={formKonten.kartu_belakang as string}
            alt="Preview belakang"
            className="mt-2 max-h-32 rounded border border-gray-200"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
    </div>
  )

  const renderLainnyaFields = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Hint</label>
        <input
          type="text"
          value={(formKonten.nama_hint as string) || ''}
          onChange={(e) => updateKonten('nama_hint', e.target.value)}
          placeholder="Nama hint (contoh: Tiket Konser)"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={(formKonten.gambar as string) || ''}
            onChange={(e) => updateKonten('gambar', e.target.value)}
            placeholder="URL gambar"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
          />
          <FileUploader
            accept="image/*"
            label="Upload"
            onUploadComplete={(url) => updateKonten('gambar', url)}
          />
        </div>
        {formKonten.gambar && (
          <img
            src={formKonten.gambar as string}
            alt="Preview"
            className="mt-2 max-h-32 rounded border border-gray-200"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
        <input
          type="number"
          value={(formKonten.jumlah as number) || 1}
          onChange={(e) => updateKonten('jumlah', parseInt(e.target.value) || 1)}
          min={1}
          className="w-32 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#005696] focus:border-transparent"
        />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <i className="fas fa-spinner fa-spin text-xl text-[#005696]"></i>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          <i className="fas fa-lightbulb text-amber-500"></i> Hint
        </h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <i className="fas fa-plus"></i> Tambah Hint
        </button>
      </div>

      {hints.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-6">Belum ada hint.</p>
      ) : (
        <div className="space-y-2">
          {hints.map((hint, index) => (
            <div
              key={hint.id}
              className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-xs font-bold text-amber-700 flex items-center justify-center shrink-0">
                  {hint.urutan + 1}
                </span>
                <i className={`fas ${TYPE_ICONS[hint.tipe] || 'fa-question-circle text-gray-600'} text-sm`}></i>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {HINT_TYPES.find((t) => t.value === hint.tipe)?.label || hint.tipe}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => moveHint(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <i className="fas fa-chevron-up text-xs"></i>
                </button>
                <button
                  type="button"
                  onClick={() => moveHint(index, 1)}
                  disabled={index === hints.length - 1}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <i className="fas fa-chevron-down text-xs"></i>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(hint)}
                  className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-white"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(hint.id)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-white"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-bold text-gray-800">
                {editingHint ? 'Edit Hint' : 'Tambah Hint Baru'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Hint</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {HINT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setFormTipe(t.value)
                        setFormKonten({})
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all flex items-center gap-1.5 ${
                        formTipe === t.value
                          ? 'border-[#005696] bg-blue-50 text-[#005696]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <i className={`fas ${t.icon}`}></i>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100" />

              {renderFormFields()}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#005696] text-white rounded-lg text-sm font-semibold hover:bg-[#003d6e] transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-save"></i>
                )}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
