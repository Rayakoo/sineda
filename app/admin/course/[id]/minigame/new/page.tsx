'use client'

import { useParams } from 'next/navigation'
import MinigameForm from '@/app/components/admin/MinigameForm'

export default function NewMinigamePage() {
  const params = useParams()
  const courseId = params?.id as string

  return (
    <MinigameForm
      courseId={courseId}
      isNew={true}
    />
  )
}
