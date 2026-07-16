'use client'

import { useParams } from 'next/navigation'
import MinigameForm from '@/app/components/admin/MinigameForm'

export default function EditMinigamePage() {
  const params = useParams()
  const courseId = params?.id as string
  const minigameId = params?.minigameId as string

  return (
    <MinigameForm
      courseId={courseId}
      minigameId={minigameId}
      isNew={false}
    />
  )
}
