'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VideoForm from '@/app/components/admin/VideoForm'
import { getCourseVideos } from '@/services/courses'
import type { CourseVideo } from '@/types/course'

export default function EditVideoPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const videoId = params?.videoId as string
  const [videoData, setVideoData] = useState<CourseVideo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId || !videoId) return
    getCourseVideos(courseId)
      .then((videos) => {
        const found = videos.find((v) => v.id === videoId)
        if (found) setVideoData(found)
        else router.push(`/admin/course/${courseId}`)
      })
      .catch(() => router.push(`/admin/course/${courseId}`))
      .finally(() => setLoading(false))
  }, [courseId, videoId, router])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-[#005696] border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="bg-[#E0F2FE] -mx-10 -mt-10 px-10 py-4 flex items-center shadow-sm mb-10">
        <button onClick={() => router.push(`/admin/course/${courseId}`)}
          className="bg-[#005696] text-white text-xs px-4 py-1.5 rounded-lg hover:bg-[#003d6e] flex items-center gap-1 transition-colors">
          <i className="fas fa-arrow-left text-xs"></i> Kembali
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit video</span>
        </div>
      </div>
      <VideoForm courseId={courseId} videoData={videoData} />
    </div>
  )
}
