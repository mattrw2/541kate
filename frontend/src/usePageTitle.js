import { useEffect } from "react"

// Sets the browser tab title for as long as the page is mounted, reverting to
// the site default when it unmounts or while title is falsy (e.g. loading).
export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · 541kate` : "541kate"
    return () => {
      document.title = "541kate"
    }
  }, [title])
}
