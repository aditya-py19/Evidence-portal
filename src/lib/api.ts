/**
 * Centralized API fetch helper for Evidence Portal.
 * Automatically attaches Authorization: Bearer <token> for authenticated requests,
 * handles 401 Unauthorized responses centrally, and provides blob download helpers for PDFs.
 */

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('evidence-portal-token') || localStorage.getItem('token')
  const headers = new Headers(init?.headers)

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(input, { ...init, headers })

  if (response.status === 401) {
    console.warn('[AUTH 401] Unauthorized response received. Clearing session state.')
    localStorage.removeItem('evidence-portal-token')
    localStorage.removeItem('evidence-portal-user')
    localStorage.removeItem('token')

    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  return response
}

export async function downloadAuthenticatedBlob(url: string, defaultFilename: string, mimeType = 'application/pdf'): Promise<void> {
  const response = await apiFetch(url)
  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`Failed to download resource (${response.status}): ${errText || response.statusText}`)
  }

  const blob = await response.blob()
  const blobUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }))
  const windowRef = window.open(blobUrl, '_blank')
  if (!windowRef) {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = defaultFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
}
