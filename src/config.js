const backendBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://192.168.56.10:8000/api'

export const API_BASE_URL = backendBaseUrl.replace(/\/+$/, '')
