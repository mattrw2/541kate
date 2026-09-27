import { useEffect } from "react"
import { apiUrl } from "./api"

// While a challenge page is open, make "Add to Home Screen" use the challenge:
// its cover photo (cropped to a square around the spot the uploader tapped, or
// the center) as the icon and its name as the label.
// Phones read these from the page when the icon is added, so we swap them in
// on mount and restore the site defaults on unmount.

const getLink = (rel) => {
  let el = document.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement("link")
    el.rel = rel
    document.head.appendChild(el)
  }
  return el
}

const getMeta = (name) => {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.name = name
    document.head.appendChild(el)
  }
  return el
}

// The square region (in pixels) of a W×H photo to use for the icon. With a focus
// (fractions of width and height), zoom in on it; otherwise take the largest
// centered square. Also used by PhotoFocusPicker to preview the crop.
export const focusSquare = (W, H, focus) => {
  const side = focus ? Math.min(W, H) * 0.6 : Math.min(W, H)
  const cx = focus ? focus.x * W : W / 2
  const cy = focus ? focus.y * H : H / 2
  const clamp = (v, max) => Math.min(Math.max(v, 0), max)
  return { x: clamp(cx - side / 2, W - side), y: clamp(cy - side / 2, H - side), width: side, height: side }
}

// Draw the chosen square region as a size×size PNG data URL.
const squareIcon = (img, crop, size) => {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = size
  canvas.getContext("2d").drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size)
  return canvas.toDataURL("image/png")
}

export const useHomeScreenIcon = (challenge) => {
  const id = challenge?.id
  const name = challenge?.name
  const photoPath = challenge?.photo_path
  const focusX = challenge?.photo_focus_x
  const focusY = challenge?.photo_focus_y

  useEffect(() => {
    if (!id) return
    const icon = getLink("apple-touch-icon")
    const appTitle = getMeta("apple-mobile-web-app-title")
    const prev = { title: document.title, icon: icon.getAttribute("href"), appTitle: appTitle.content }
    let manifestUrl = null
    let cancelled = false

    document.title = name
    appTitle.content = name

    if (photoPath) {
      const img = new Image()
      // The photo is served by the backend (another origin); it sends CORS
      // headers, which lets us read it back out of the canvas.
      img.crossOrigin = "anonymous"
      img.onload = () => {
        if (cancelled) return
        const crop = focusSquare(img.naturalWidth, img.naturalHeight, focusX != null ? { x: focusX, y: focusY } : null)
        try {
          icon.href = squareIcon(img, crop, 180)
          // Android reads the web app manifest instead.
          const manifest = {
            name,
            short_name: name,
            start_url: window.location.href,
            display: "browser",
            theme_color: "#ca8a04",
            background_color: "#ffffff",
            icons: [192, 512].map((size) => ({ src: squareIcon(img, crop, size), sizes: `${size}x${size}`, type: "image/png" })),
          }
          manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }))
          getLink("manifest").href = manifestUrl
        } catch {
          // Canvas unreadable (e.g. missing CORS headers): keep the default icon.
        }
      }
      // Separate URL from the banner's <img>: that one is fetched without CORS,
      // and reusing its cached copy here would make the canvas unreadable.
      img.src = `${apiUrl}${photoPath}?icon`
    }

    return () => {
      cancelled = true
      document.title = prev.title
      appTitle.content = prev.appTitle
      if (prev.icon) icon.setAttribute("href", prev.icon)
      if (manifestUrl) {
        document.querySelector('link[rel="manifest"]')?.remove()
        URL.revokeObjectURL(manifestUrl)
      }
    }
  }, [id, name, photoPath, focusX, focusY])
}
