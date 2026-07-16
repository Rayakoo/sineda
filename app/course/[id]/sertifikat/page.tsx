'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function SertifikatPage() {
  const params = useParams()

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-3xl shadow-lg border border-yellow-200 p-10 mb-6">
          <i className="fas fa-certificate text-7xl text-yellow-500 mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sertifikat</h1>
          <p className="text-gray-500 text-sm">Selamat! Kamu telah menyelesaikan seluruh materi.</p>
          <p className="text-xs text-gray-400 mt-4">Fitur unduh sertifikat akan segera tersedia.</p>
        </div>
        <Link href={`/course/${params.id}/materi`}
          className="inline-block bg-[#005696] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#003d6e] transition">
          Kembali ke Materi
        </Link>
      </div>
    </div>
  )
}
