'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ModuleForm from '@/app/components/admin/ModuleForm'
import { getCourseMaterials } from '@/services/courses'
import type { CourseMaterial } from '@/types/course'

export default function EditModulePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const moduleId = params?.moduleId as string
  const [moduleData, setModuleData] = useState<CourseMaterial | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId || !moduleId) return
    getCourseMaterials(courseId)
      .then((materials) => {
        const found = materials.find((m) => m.id === moduleId)
        if (found) setModuleData(found)
        else router.push(`/admin/course/${courseId}`)
      })
      .catch(() => router.push(`/admin/course/${courseId}`))
      .finally(() => setLoading(false))
  }, [courseId, moduleId, router])

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
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit modul</span>
        </div>
      </div>
      <ModuleForm courseId={courseId} moduleData={moduleData} />
    </div>
  )
}
