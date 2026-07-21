const backendBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

export const API_BASE_URL = backendBaseUrl.replace(/\/+$/, '')
