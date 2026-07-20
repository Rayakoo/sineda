'use client'

import type { UnsolvedCaseHint, UnsolvedCaseHintChat, UnsolvedCaseHintKarakter, UnsolvedCaseHintBuku, UnsolvedCaseHintKartu, UnsolvedCaseHintLainnya } from '@/types/course'

type Props = {
  hint: UnsolvedCaseHint
}

export default function HintRenderer({ hint }: Props) {
  switch (hint.tipe) {
    case 'chat':
      return <ChatHint konten={hint.konten as UnsolvedCaseHintChat} />
    case 'karakter':
      return <KarakterHint konten={hint.konten as UnsolvedCaseHintKarakter} />
    case 'buku':
      return <BukuHint konten={hint.konten as UnsolvedCaseHintBuku} />
    case 'kartu':
      return <KartuHint konten={hint.konten as UnsolvedCaseHintKartu} />
    case 'lainnya':
      return <LainnyaHint konten={hint.konten as UnsolvedCaseHintLainnya} />
    default:
      return <p className="text-sm text-[#a09080]">Tipe hint tidak dikenal</p>
  }
}

function ChatHint({ konten }: { konten: UnsolvedCaseHintChat }) {
  if (konten.is_chat) {
    return (
      <div className="max-w-sm mx-auto">
        <div className="bg-[#f5efe6] rounded-2xl p-4 border border-[#d4c4a8]">
          <div className="bg-[#5c3d2e] text-white text-xs font-bold px-3 py-1.5 rounded-t-lg -mx-4 -mt-4 mb-3 text-center">
            {konten.nama_lawan_chat || 'Chat'}
          </div>
          <div className="space-y-2">
            {konten.images?.map((img, i) => (
              <div key={i} className="flex justify-start">
                <div className="bg-white rounded-xl rounded-bl-sm px-3 py-2 shadow-sm border border-[#e8dcc8] max-w-[80%]">
                  <img
                    src={img}
                    alt={`Chat ${i + 1}`}
                    className="max-h-48 rounded-lg"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {konten.judul_hint && (
        <h4 className="font-bold text-sm text-[#3c2415] mb-2">{konten.judul_hint}</h4>
      )}
      <div className="space-y-2">
        {konten.images?.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Status ${i + 1}`}
            className="max-h-60 rounded-xl border border-[#d4c4a8]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ))}
      </div>
    </div>
  )
}

function KarakterHint({ konten }: { konten: UnsolvedCaseHintKarakter }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {konten.foto_karakter && (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#c4a882] shrink-0 bg-[#e8dcc8]">
            <img
              src={konten.foto_karakter}
              alt={konten.nama}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}
        <div>
          <h4 className="font-bold text-[#3c2415]">{konten.nama}</h4>
          <p className="text-xs text-[#a09080] italic">Saksi Kunci</p>
        </div>
      </div>
      {konten.images && konten.images.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider mb-2 border-b border-[#e8dcc8] pb-1">
            <i className="fas fa-quote-left mr-1"></i>
            Kesaksian
          </p>
          <div className="space-y-2 mt-2">
            {konten.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`Kesaksian ${i + 1}`}
                className="max-h-48 rounded-xl border border-[#d4c4a8] bg-[#faf6f0]"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BukuHint({ konten }: { konten: UnsolvedCaseHintBuku }) {
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-[#3c2415] italic" style={{ fontFamily: 'serif' }}>{konten.judul_buku}</h4>
      {konten.cover_buku && (
        <div className="flex justify-center">
          <img
            src={konten.cover_buku}
            alt={`Cover ${konten.judul_buku}`}
            className="max-h-48 rounded-xl border border-[#c4a882] shadow-md"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
      {konten.isi_buku && konten.isi_buku.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider border-b border-[#e8dcc8] pb-1">
            <i className="fas fa-book-open mr-1"></i>
            Isi Buku
          </p>
          {konten.isi_buku.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Halaman ${i + 1}`}
              className="max-h-48 rounded-xl border border-[#d4c4a8]"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function KartuHint({ konten }: { konten: UnsolvedCaseHintKartu }) {
  return (
    <div className="space-y-4">
      <h4 className="font-bold text-[#3c2415] text-center">{konten.nama_kartu}</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider mb-1">Depan</p>
          {konten.kartu_depan && (
            <img
              src={konten.kartu_depan}
              alt="Kartu depan"
              className="max-h-32 rounded-xl border border-[#d4c4a8] shadow-sm bg-white"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#8b7355] uppercase tracking-wider mb-1">Belakang</p>
          {konten.kartu_belakang && (
            <img
              src={konten.kartu_belakang}
              alt="Kartu belakang"
              className="max-h-32 rounded-xl border border-[#d4c4a8] shadow-sm bg-white"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function LainnyaHint({ konten }: { konten: UnsolvedCaseHintLainnya }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-[#3c2415]">{konten.nama_hint}</h4>
        {konten.jumlah > 1 && (
          <span className="bg-[#e8dcc8] text-[#8b4513] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#c4a882]">
            x{konten.jumlah}
          </span>
        )}
      </div>
      {konten.gambar && (
        <img
          src={konten.gambar}
          alt={konten.nama_hint}
          className="max-h-40 rounded-xl border border-[#d4c4a8] bg-[#faf6f0]"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}
