import { useState } from "react"

// Copy text to the clipboard and briefly flash a "copied" state. Falls back to a
// temporary textarea + execCommand for non-secure contexts where the async
// clipboard API isn't available.
export const useCopyButton = (resetMs = 2000) => {
  const [copied, setCopied] = useState(false)

  const copy = async (text) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      } else {
        const el = document.createElement("textarea")
        el.value = text
        el.style.position = "fixed"
        el.style.opacity = "0"
        document.body.appendChild(el)
        el.focus()
        el.select()
        document.execCommand("copy")
        document.body.removeChild(el)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), resetMs)
    } catch (e) {
      // Clipboard unavailable or blocked — leave state unchanged.
    }
  }

  return { copied, copy }
}
