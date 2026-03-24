/**
 * Upload pliku do Cloudinary (unsigned upload preset).
 * W panelu Cloudinary: Settings → Upload → Upload presets → utwórz unsigned preset.
 * PDF muszą mieć w presecie dozwolony typ **Raw** (File), inaczej /raw/upload zwróci błąd.
 */
function isPdfFile(file) {
  if (!file) return false
  if (file.type === 'application/pdf') return true
  const n = String(file.name || '').toLowerCase()
  return n.endsWith('.pdf')
}

/** Po odpowiedzi API: upewnij się, że CDN faktycznie serwuje plik (unikamy „zapisu w bazie + 404 w przeglądarce”). */
async function verifyDeliveryUrl(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', mode: 'cors', credentials: 'omit' })
    if (r.ok) return { ok: true }
    return { ok: false, status: r.status }
  } catch {
    return { ok: null }
  }
}

export async function uploadToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || 'first_lead_docs'

  if (!cloudName?.trim() || !uploadPreset?.trim()) {
    return {
      error: new Error(
        'Brak VITE_CLOUDINARY_CLOUD_NAME lub VITE_CLOUDINARY_UPLOAD_PRESET w frontend/.env — dodaj i zrestartuj Vite.',
      ),
    }
  }

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', uploadPreset.trim())
  if (folder.trim()) body.append('folder', folder.trim())

  const pdf = isPdfFile(file)
  if (pdf) {
    body.append('resource_type', 'raw')
  }
  const endpoint = pdf ? 'raw/upload' : 'auto/upload'

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName.trim()}/${endpoint}`, {
    method: 'POST',
    body,
  })

  let json
  try {
    json = await res.json()
  } catch {
    return { error: new Error('Niepoprawna odpowiedź Cloudinary') }
  }

  if (!res.ok) {
    const msg = json?.error?.message || json?.error || `HTTP ${res.status}`
    const hint = pdf
      ? ' Dla PDF preset musi zezwalać na typ Raw (File) w Cloudinary.'
      : ''
    return { error: new Error(String(msg) + hint) }
  }

  const secureUrl = json.secure_url
  if (!secureUrl || typeof secureUrl !== 'string') {
    return { error: new Error('Cloudinary nie zwrócił secure_url — sprawdź odpowiedź uploadu.') }
  }

  const check = await verifyDeliveryUrl(secureUrl)
  if (check.ok === false) {
    return {
      error: new Error(
        `Plik został przyjęty przez API, ale pod adresem CDN jest błąd HTTP ${check.status}. Nie zapisujemy go — spróbuj ponownie lub zmień preset/folder w Cloudinary.`,
      ),
    }
  }

  return {
    data: {
      public_id: json.public_id,
      secure_url: secureUrl,
      resource_type: json.resource_type ?? null,
      format: json.format ?? null,
      original_filename: file.name || null,
      uploaded_at: new Date().toISOString(),
    },
  }
}

export function cloudinaryConfigured() {
  return Boolean(
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() &&
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim(),
  )
}
