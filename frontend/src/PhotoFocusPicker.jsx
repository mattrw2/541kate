import { useEffect, useMemo, useRef, useState } from "react"
import { focusSquare } from "./homeScreenIcon"

// Preview of a cover photo with a draggable square marking the part to feature
// (e.g. a face) — exactly the crop used for the home-screen icon. focus is
// { x, y } as fractions of the photo's width/height; it defaults to the center
// once the photo loads. Pass a File (newly picked) or a URL (existing photo).
export const PhotoFocusPicker = ({ file, url, focus, onChange }) => {
  const fileUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => fileUrl && URL.revokeObjectURL(fileUrl), [fileUrl])
  const [size, setSize] = useState(null) // natural { w, h } once loaded
  const dragging = useRef(false)
  const src = fileUrl || url
  if (!src) return null

  // Center the square on the pointer (tap or drag).
  const moveTo = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clamp = (v) => Math.min(1, Math.max(0, v))
    onChange({ x: clamp((e.clientX - rect.left) / rect.width), y: clamp((e.clientY - rect.top) / rect.height) })
  }

  const sq = focus && size && focusSquare(size.w, size.h, focus)

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 mb-1">Drag the square over the part to feature, like a face. It's used for the home-screen icon on mobile devices.</p>
      <div
        className="relative inline-block overflow-hidden rounded cursor-move touch-none select-none"
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          moveTo(e)
        }}
        onPointerMove={(e) => dragging.current && moveTo(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img
          src={src}
          alt="Cover photo"
          className="block max-h-64 max-w-full rounded"
          draggable={false}
          onLoad={(e) => {
            setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            if (!focus) onChange({ x: 0.5, y: 0.5 })
          }}
        />
        {sq && (
          <span
            className="absolute border-2 border-white ring-2 ring-yellow-500 rounded-sm pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
            style={{
              left: `${(sq.x / size.w) * 100}%`,
              top: `${(sq.y / size.h) * 100}%`,
              width: `${(sq.width / size.w) * 100}%`,
              height: `${(sq.height / size.h) * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}
