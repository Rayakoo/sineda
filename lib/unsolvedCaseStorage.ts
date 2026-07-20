const PREFIX = 'uc_'

export function getDetectiveName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(`${PREFIX}detective_name`) || ''
}

export function setDetectiveName(name: string) {
  localStorage.setItem(`${PREFIX}detective_name`, name)
}

export function getConfirmed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(`${PREFIX}confirmed`) === 'true'
}

export function setConfirmed(val: boolean) {
  localStorage.setItem(`${PREFIX}confirmed`, val ? 'true' : 'false')
}

export function getRevealedHints(unsolvedCaseId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(`${PREFIX}revealed_${unsolvedCaseId}`)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

export function addRevealedHint(unsolvedCaseId: string, hintId: string) {
  const set = getRevealedHints(unsolvedCaseId)
  set.add(hintId)
  localStorage.setItem(`${PREFIX}revealed_${unsolvedCaseId}`, JSON.stringify([...set]))
}

export function getDraftName(courseId: string): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(`${PREFIX}${courseId}_draft_name`) || ''
}

export function setDraftName(courseId: string, name: string) {
  localStorage.setItem(`${PREFIX}${courseId}_draft_name`, name)
}

export function clearDraftName(courseId: string) {
  localStorage.removeItem(`${PREFIX}${courseId}_draft_name`)
}

export function clearAll(unsolvedCaseId?: string, courseId?: string) {
  localStorage.removeItem(`${PREFIX}detective_name`)
  localStorage.removeItem(`${PREFIX}confirmed`)
  if (unsolvedCaseId) {
    localStorage.removeItem(`${PREFIX}revealed_${unsolvedCaseId}`)
  }
  if (courseId) {
    localStorage.removeItem(`${PREFIX}${courseId}_draft_name`)
  }
}
