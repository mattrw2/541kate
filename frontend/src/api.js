export const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000"

// Wrap fetch so the HttpOnly device cookie is sent with every API call.
// Pass a full URL (built with apiUrl). Callers' own options/headers win.
export const apiFetch = (url, opts = {}) =>
  fetch(url, { credentials: "include", ...opts })
