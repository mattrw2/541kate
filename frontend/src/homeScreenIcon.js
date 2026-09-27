import { useEffect } from "react"
import smartcrop from "smartcrop"
import { apiUrl } from "./api"

// While a challenge page is open, make "Add to Home Screen" use the challenge:
// its cover photo (cropped to a square around the subject) as the icon and its
// name as the label.
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

// Pick the square region of the photo to use. smartcrop favors skin tones and
// detail, so it usually lands on people's faces rather than background; if it
// fails, fall back to the center square.
const pickSquare = async (img) => {
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const center = { x: (img.naturalWidth - side) / 2, y: (img.naturalHeight - side) / 2, width: side, height: side }
  try {
    // minScale < 1 lets it zoom in on a subject instead of taking the largest square.
    const { topCrop } = await smartcrop.crop(img, { width: 180, height: 180, minScale: 0.5 })
    return topCrop || center
  } catch {
    return center
  }
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
      img.onload = async () => {
        const crop = await pickSquare(img)
        if (cancelled) return
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
      img.src = `${apiUrl}${photoPath}`
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
  }, [id, name, photoPath])
}
