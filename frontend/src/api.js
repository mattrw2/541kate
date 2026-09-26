export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

// The tenant's secret key is the only credential; the acting user is whoever is
// picked in the profile switcher. Both live in localStorage and ride along on
// every API call as headers.
const KEY_STORAGE = "tenantKey"
const USER_STORAGE = "currentProfileId"

const read = (k) => {
  try { return localStorage.getItem(k) } catch { return null }
}
const write = (k, v) => {
  try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, String(v)) } catch {}
}

export const getTenantKey = () => read(KEY_STORAGE)
export const setTenantKey = (key) => write(KEY_STORAGE, key)
export const getActingUserId = () => parseInt(read(USER_STORAGE) || "", 10) || null
export const setActingUserId = (id) => write(USER_STORAGE, id)

// Pass a full URL (built with apiUrl). Callers' own options/headers win.
export const apiFetch = (url, opts = {}) => {
  const auth = {}
  const key = getTenantKey()
  const userId = getActingUserId()
  if (key) auth["X-Tenant-Key"] = key
  if (userId) auth["X-User-Id"] = String(userId)
  return fetch(url, { ...opts, headers: { ...auth, ...opts.headers } })
}
