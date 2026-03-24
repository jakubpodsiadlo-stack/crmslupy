import { useEffect, useState } from 'react'
import {
  attachedFileKey,
  isImageMime,
  isPdfMime,
  isSavedCloudinaryImage,
  isSavedCloudinaryPdf,
} from '../lib/firstLeadAttachedFilesUtils'
import { cloudinaryConfigured, uploadToCloudinary } from '../lib/cloudinaryUpload'
import { normalizeUmowaFiles } from '../lib/firstLeadBackoffice'
import { formatFirstLeadSchemaError } from '../lib/firstLeadQueries'
import { supabase } from '../lib/supabase'
import { PdfInlineViewer } from './PdfInlineViewer'

/**
 * Pliki umowy — kolumna first_lead.umowa_files (jak backoffice_files, Cloudinary).
 * canEdit: true tylko dla rzeczoznawcy w zakładce „Szczegóły umowy”.
 */
export function FirstLeadUmowaFilesSection({ lead, onSaved, setSaveErr, canEdit }) {
  const [localFile, setLocalFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [savedFocusKey, setSavedFocusKey] = useState(null)

  const files = normalizeUmowaFiles(lead)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!lead?.id) return
    setLocalFile(null)
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u)
      return null
    })
    setSavedFocusKey(null)
  }, [lead?.id])

  useEffect(() => {
    const list = normalizeUmowaFiles(lead)
    if (localFile || previewUrl) return
    if (list.length === 0) {
      setSavedFocusKey(null)
      return
    }
    setSavedFocusKey((prev) => {
      if (prev && list.some((x) => attachedFileKey(x) === prev)) return prev
      return attachedFileKey(list[list.length - 1]) || null
    })
  }, [lead?.id, lead?.umowa_files, localFile, previewUrl])

  function onPickFile(e) {
    if (!canEdit) return
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setSaveErr(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setLocalFile(f)
    setPreviewUrl(URL.createObjectURL(f))
  }

  function selectUploadedFile(f) {
    const k = attachedFileKey(f)
    if (!k) return
    setSaveErr(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setLocalFile(null)
    setSavedFocusKey(k)
  }

  async function persistFiles(next) {
    const { error } = await supabase.from('first_lead').update({ umowa_files: next }).eq('id', lead.id)
    if (error) {
      setSaveErr(formatFirstLeadSchemaError(error))
      return false
    }
    onSaved?.()
    return true
  }

  async function uploadCurrentFile() {
    if (!canEdit || !localFile) return
    if (!cloudinaryConfigured()) {
      setSaveErr('Dodaj VITE_CLOUDINARY_CLOUD_NAME i VITE_CLOUDINARY_UPLOAD_PRESET w frontend/.env')
      return
    }
    setSaveErr(null)
    setUploading(true)
    const { data, error } = await uploadToCloudinary(localFile)
    if (error) {
      setSaveErr(error.message)
      setUploading(false)
      return
    }
    const next = [...normalizeUmowaFiles(lead), data]
    const ok = await persistFiles(next)
    setUploading(false)
    if (ok) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setLocalFile(null)
      const nk = data ? attachedFileKey(data) : ''
      if (nk) setSavedFocusKey(nk)
    }
  }

  async function removeFile(key) {
    if (!canEdit || !key) return
    setSaveErr(null)
    setRemovingId(key)
    const next = normalizeUmowaFiles(lead).filter((x) => attachedFileKey(x) !== key)
    if (savedFocusKey === key) {
      const nk = next.length ? attachedFileKey(next[next.length - 1]) : ''
      setSavedFocusKey(nk || null)
    }
    await persistFiles(next)
    setRemovingId(null)
  }

  const previewIsPdf = previewUrl && localFile && isPdfMime(localFile.type)
  const previewIsImage = previewUrl && localFile && isImageMime(localFile.type)
  const focusedSaved = savedFocusKey ? files.find((x) => attachedFileKey(x) === savedFocusKey) : null
  const previewStableKey =
    previewUrl && localFile
      ? `local:${localFile.name}:${localFile.size}:${localFile.lastModified}`
      : focusedSaved
        ? attachedFileKey(focusedSaved)
        : 'empty'
  const showSavedInViewport = !previewUrl && focusedSaved
  const savedViewportPdf = showSavedInViewport && isSavedCloudinaryPdf(focusedSaved)
  const savedViewportImage = showSavedInViewport && isSavedCloudinaryImage(focusedSaved)

  const fileList = (
    <div className="bo-files-layout__files-sidebar dash-umowa-files__sidebar" aria-label="Pliki umowy">
      <div className="bo-files-layout__files-sidebar-head">
        <p className="bo-files-layout__uploaded-title">Lista plików</p>
      </div>
      {files.length > 0 ? (
        <ul className="bo-files-layout__file-list" role="list">
          {files.map((f) => {
            const fKey = attachedFileKey(f)
            const active = !previewUrl && savedFocusKey === fKey
            const label =
              f.original_filename || (f.public_id ? String(f.public_id).split('/').pop() : null) || 'Plik'
            return (
              <li key={fKey || f.secure_url} className="bo-files-layout__file-list-item">
                <button
                  type="button"
                  className={`bo-files-layout__list-select ${active ? 'bo-files-layout__list-select--active' : ''}`}
                  title={`Podgląd: ${label}`}
                  onClick={() => selectUploadedFile(f)}
                >
                  {isSavedCloudinaryImage(f) ? (
                    <img src={f.secure_url} alt="" className="bo-files-layout__list-thumb" />
                  ) : (
                    <span className="bo-files-layout__list-icon">
                      {isSavedCloudinaryPdf(f) ? 'PDF' : '∎'}
                    </span>
                  )}
                  <span className="bo-files-layout__list-name">{label}</span>
                </button>
                {canEdit ? (
                  <button
                    type="button"
                    className="bo-files-layout__list-remove"
                    aria-label={`Usuń ${label}`}
                    disabled={removingId === fKey}
                    onClick={() => removeFile(fKey)}
                  >
                    {removingId === fKey ? '…' : '×'}
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="bo-files-layout__files-sidebar-empty dash-muted">
          {canEdit
            ? 'Brak plików. Wybierz dokument (PDF lub obraz) i wgraj do chmury.'
            : 'Brak załączonych plików umowy.'}
        </p>
      )}
    </div>
  )

  return (
    <div className="bo-files-layout dash-umowa-files">
      {fileList}
      <div className="bo-files-layout__preview-pane">
        {canEdit ? (
          <div className="bo-files-layout__toolbar">
            <div className="bo-files-layout__toolbar-row">
              <label className="bo-files-layout__file-label">
                <span className="bo-files-layout__file-btn">Wybierz plik</span>
                <input
                  type="file"
                  accept="image/*,.pdf,application/pdf"
                  className="bo-files-layout__file-input"
                  onChange={onPickFile}
                />
              </label>
              <button
                type="button"
                className="dash__btn-primary bo-files-layout__upload-btn"
                disabled={!localFile || uploading}
                onClick={() => uploadCurrentFile()}
              >
                {uploading ? 'Wgrywanie…' : 'Wgraj do Cloudinary'}
              </button>
            </div>
          </div>
        ) : null}

        <div
          className={`bo-files-layout__viewport bo-files-layout__viewport--narrow ${previewIsPdf || savedViewportPdf ? 'bo-files-layout__viewport--pdf' : ''}`}
          aria-label="Podgląd pliku umowy"
        >
          {previewIsImage ? (
            <div key={previewStableKey} className="bo-files-layout__viewport-inner">
              <img src={previewUrl} alt="Podgląd" className="bo-files-layout__img" />
            </div>
          ) : null}
          {previewIsPdf ? (
            <PdfInlineViewer key={previewStableKey} url={previewUrl} title="Podgląd PDF (lokalny)" />
          ) : null}
          {savedViewportImage && focusedSaved ? (
            <div key={previewStableKey} className="bo-files-layout__viewport-inner">
              <img
                src={focusedSaved.secure_url}
                alt={focusedSaved.original_filename || 'Dokument'}
                className="bo-files-layout__img"
              />
            </div>
          ) : null}
          {savedViewportPdf && focusedSaved ? (
            <PdfInlineViewer
              key={previewStableKey}
              url={focusedSaved.secure_url}
              title={focusedSaved.original_filename || 'PDF'}
            />
          ) : null}
          {showSavedInViewport && focusedSaved && !savedViewportImage && !savedViewportPdf ? (
            <div className="bo-files-layout__viewport-empty dash-muted">
              <a href={focusedSaved.secure_url} target="_blank" rel="noopener noreferrer">
                Otwórz plik w nowej karcie
              </a>
            </div>
          ) : null}
          {!previewUrl && !showSavedInViewport && files.length === 0 ? (
            <p className="bo-files-layout__viewport-empty dash-muted">
              {canEdit ? 'Wybierz plik powyżej — po wgraniu pojawi się tutaj.' : 'Brak plików do podglądu.'}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
