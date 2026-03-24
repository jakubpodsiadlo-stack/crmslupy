/** Unikalny identyfikator wpisu w jsonb plików (public_id lub secure_url). */
export function attachedFileKey(f) {
  if (!f) return ''
  const pid = f.public_id
  if (pid != null && String(pid).trim() !== '') return String(pid)
  return String(f.secure_url || '')
}

export function isImageMime(type) {
  return /^image\/(jpeg|jpg|png|webp|gif|bmp|tif|tiff)$/i.test(type || '')
}

export function isPdfMime(type) {
  return type === 'application/pdf'
}

/** Cloudinary bywa ustawia PDF jako resource_type `image` — najpierw wykluczamy PDF. */
export function looksLikePdfFile(f) {
  if (!f) return false
  const fmt = String(f.format || '').toLowerCase()
  if (fmt === 'pdf') return true
  const name = String(f.original_filename || '').toLowerCase()
  if (name.endsWith('.pdf')) return true
  const u = String(f.secure_url || '').toLowerCase()
  return /\.pdf(\?|#|$)/i.test(u)
}

export function isSavedCloudinaryPdf(f) {
  if (!f?.secure_url) return false
  return looksLikePdfFile(f)
}

export function isSavedCloudinaryImage(f) {
  if (!f?.secure_url) return false
  if (looksLikePdfFile(f)) return false
  if (f.resource_type === 'image') return true
  return /\.(jpe?g|png|webp|gif|bmp|tif|tiff)(\?|#|$)/i.test(f.secure_url)
}
