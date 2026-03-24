function normalizeLeadFilesColumn(row, columnKey) {
  const raw = row?.[columnKey]
  if (raw == null) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p.filter(Boolean) : []
    } catch {
      return []
    }
  }
  return []
}

/** Normalizuje `backoffice_files` z wiersza first_lead (jsonb → tablica). */
export function normalizeBackofficeFiles(row) {
  return normalizeLeadFilesColumn(row, 'backoffice_files')
}

/** Normalizuje `umowa_files` (pliki przy szczegółach umowy). */
export function normalizeUmowaFiles(row) {
  return normalizeLeadFilesColumn(row, 'umowa_files')
}

export function backofficeFileCount(row) {
  return normalizeBackofficeFiles(row).length
}

export function umowaFileCount(row) {
  return normalizeUmowaFiles(row).length
}
