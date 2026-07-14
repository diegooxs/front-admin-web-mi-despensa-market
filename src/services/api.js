import { API_BASE_URL } from '../config'
import { clearSession, getAccessToken } from './auth'

function extractErrorMessage(payload, status) {
  if (typeof payload === 'string' && payload.trim()) {
    const normalizedPayload = payload.trim().toLowerCase()
    const isHtml =
      normalizedPayload.startsWith('<!doctype html') ||
      normalizedPayload.startsWith('<html') ||
      normalizedPayload.includes('<body')

    if (isHtml) {
      return `El servidor encontró un error al procesar la solicitud (${status})`
    }

    return payload
  }

  const directMessage = payload?.detail || payload?.error || payload?.mensaje
  if (directMessage) return directMessage

  if (payload && typeof payload === 'object') {
    const fieldErrors = Object.entries(payload).flatMap(([field, messages]) => {
      const values = Array.isArray(messages) ? messages : [messages]
      const label = field === 'non_field_errors' ? '' : `${field}: `
      return values.filter(Boolean).map((message) => `${label}${message}`)
    })

    if (fieldErrors.length) return fieldErrors.join(' ')
  }

  return `La solicitud no pudo completarse (${status})`
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json')

  const isFormData = options.body instanceof FormData

  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getAccessToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !isFormData && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    if (response.status === 401) {
      clearSession()
    }

    throw new Error(extractErrorMessage(payload, response.status))
  }

  return payload
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
