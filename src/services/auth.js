const ACCESS_KEY = 'admin_web_access'
const REFRESH_KEY = 'admin_web_refresh'
const PROFILE_KEY = 'admin_web_profile'

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function getStoredProfile() {
  const raw = localStorage.getItem(PROFILE_KEY)
  return raw ? JSON.parse(raw) : null
}

export function storeSession(payload) {
  localStorage.setItem(ACCESS_KEY, payload.access)
  localStorage.setItem(REFRESH_KEY, payload.refresh)
  localStorage.setItem(PROFILE_KEY, JSON.stringify(payload.usuario))
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(PROFILE_KEY)
}
