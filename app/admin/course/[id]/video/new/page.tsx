'use client'

import { useParams, useRouter } from 'next/navigation'
import VideoForm from '@/app/components/admin/VideoForm'

export default function NewVideoPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string

  return (
    <div>
      <div className="bg-[#E0F2FE] -mx-10 -mt-10 px-10 py-4 flex items-center shadow-sm mb-10">
        <button onClick={() => router.push(`/admin/course/${courseId}`)}
          className="bg-[#005696] text-white text-xs px-4 py-1.5 rounded-lg hover:bg-[#003d6e] flex items-center gap-1 transition-colors">
          <i className="fas fa-arrow-left text-xs"></i> Kembali
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Buat video</span>
        </div>
      </div>
      <VideoForm courseId={courseId} />
    </div>
  )
}
