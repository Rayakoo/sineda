'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function MinigamePage() {
  const params = useParams()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <i className="fas fa-gamepad text-7xl text-orange-300 mb-6"></i>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Minigame</h1>
        <p className="text-gray-500 mb-6">Minigame sedang dalam pengembangan. Nantikan update selanjutnya!</p>
        <Link href={`/course/${params.id}/materi`}
          className="inline-block bg-[#005696] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#003d6e] transition">
          Kembali ke Materi
        </Link>
      </div>
    </div>
  )
}
