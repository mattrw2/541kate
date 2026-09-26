// Shrink a photo in the browser before upload: scale it so the longest side is
// at most maxDim and re-encode as JPEG. Falls back to the original file if the
// browser can't decode it (e.g. some HEIC) or compressing wouldn't save space.
export const compressImage = async (file, { maxDim = 1600, quality = 0.8 } = {}) => {
  if (!file?.type?.startsWith("image/") || file.type === "image/gif") return file
  try {
    // from-image applies EXIF rotation so phone photos aren't sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    // JPEG has no transparency; give transparent PNGs a white background.
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]*$/, "") + ".jpg"
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  }
}
