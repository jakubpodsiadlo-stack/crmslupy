import { useEffect, useState } from 'react'
import {
  attachedFileKey,
  isImageMime,
  isPdfMime,
  isSavedCloudinaryImage,
  isSavedCloudinaryPdf,
} from '../lib/firstLeadAttachedFilesUtils'
import { cloudinaryConfigured, uploadToCloudinary } from '../lib/cloudinaryUpload'
import { normalizeBackofficeFiles } from '../lib/firstLeadBackoffice'
import { getBackofficeStatusLabel } from '../lib/firstLeadDisplay'
import { formatFirstLeadSchemaError } from '../lib/firstLeadQueries'
import { supabase } from '../lib/supabase'
import { IconHash, IconHome, IconLand, IconMapPin, IconUser } from './icons/CodeModalIcons'
import { PdfInlineViewer } from './PdfInlineViewer'

export function FirstLeadBackofficeFilesTab({
  lead,
  onSaved,
  setSaveErr,
  canEdit = true,
  clientFullName,
  setClientFullName,
  residenceStreet,
  setResidenceStreet,
  residencePostalCode,
  setResidencePostalCode,
  residenceCity,
  setResidenceCity,
  backofficeNotes,
  setBackofficeNotes,
  onSaveClient,
  savingClient,
}) {
  const [localFile, setLocalFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [ocrText, setOcrText] = useState('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMsg, setOcrMsg] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [savingBo, setSavingBo] = useState(false)
  /** Który wgrany plik pokazać w podglądzie (klucz z attachedFileKey). */
  const [savedFocusKey, setSavedFocusKey] = useState(null)

  const files = normalizeBackofficeFiles(lead)
  const boStatus = getBackofficeStatusLabel(lead)

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
    setOcrText('')
    setOcrMsg(null)
    setSavedFocusKey(null)
  }, [lead?.id])

  useEffect(() => {
    const list = normalizeBackofficeFiles(lead)
    if (localFile || previewUrl) return
    if (list.length === 0) {
      setSavedFocusKey(null)
      return
    }
    setSavedFocusKey((prev) => {
      if (prev && list.some((x) => attachedFileKey(x) === prev)) return prev
      return attachedFileKey(list[list.length - 1]) || null
    })
  }, [lead?.id, lead?.backoffice_files, localFile, previewUrl])

  async function runOcrOnFile(file) {
    setOcrLoading(true)
    setOcrMsg(null)
    setOcrText('')
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker(['pol', 'eng'])
      const { data } = await worker.recognize(file)
      await worker.terminate()
      setOcrText(data.text?.trim() ? data.text : '')
      setOcrMsg(data.text?.trim() ? null : 'OCR nie odczytał tekstu — uzupełnij dane ręcznie.')
    } catch (err) {
      setOcrMsg(err?.message || 'Błąd OCR')
    } finally {
      setOcrLoading(false)
    }
  }

  function onPickFile(e) {
    if (!canEdit) return
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    setSaveErr(null)
    setOcrMsg(null)
    setOcrText('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const url = URL.createObjectURL(f)
    setLocalFile(f)
    setPreviewUrl(url)

    if (isImageMime(f.type)) {
      runOcrOnFile(f)
    } else if (isPdfMime(f.type)) {
      setOcrMsg(null)
    } else {
      setOcrMsg('Ten typ pliku — po wgraniu otwórz z listy po lewej.')
    }
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
    if (!canEdit) return false
    const { error } = await supabase.from('first_lead').update({ backoffice_files: next }).eq('id', lead.id)
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
    const next = [...normalizeBackofficeFiles(lead), data]
    const ok = await persistFiles(next)
    setUploading(false)
    if (ok) {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setLocalFile(null)
      setOcrText('')
      setOcrMsg(null)
      const nk = data ? attachedFileKey(data) : ''
      if (nk) setSavedFocusKey(nk)
    }
  }

  async function removeFile(key) {
    if (!canEdit || !key) return
    setSaveErr(null)
    setRemovingId(key)
    const next = normalizeBackofficeFiles(lead).filter((x) => attachedFileKey(x) !== key)
    if (savedFocusKey === key) {
      const nk = next.length ? attachedFileKey(next[next.length - 1]) : ''
      setSavedFocusKey(nk || null)
    }
    await persistFiles(next)
    setRemovingId(null)
  }

  async function setBoVerified() {
    if (!canEdit) return
    setSaveErr(null)
    setSavingBo(true)
    const nowIso = new Date().toISOString()
    const { error } = await supabase
      .from('first_lead')
      .update({
        backoffice_status: 'zweryfikowany',
        backoffice_archived_at: nowIso,
      })
      .eq('id', lead.id)
    setSavingBo(false)
    if (error) {
      setSaveErr(formatFirstLeadSchemaError(error))
      return
    }
    onSaved?.()
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
    <div className="bo-files-layout__files-sidebar" aria-label="Lista wgranych plików">
      <div className="bo-files-layout__files-sidebar-head">
        <p className="bo-files-layout__uploaded-title">Wgrane pliki</p>
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
                  title={`Pokaż w podglądzie: ${label}`}
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
                <button
                  type="button"
                  className="bo-files-layout__list-remove"
                  aria-label={`Usuń ${label}`}
                  disabled={!canEdit || removingId === fKey}
                  onClick={() => removeFile(fKey)}
                >
                  {removingId === fKey ? '…' : '×'}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="bo-files-layout__files-sidebar-empty dash-muted">
          Brak plików w chmurze. Wybierz plik w podglądzie obok i kliknij „Wgraj do Cloudinary”.
        </p>
      )}
    </div>
  )

  return (
    <div className="bo-files-layout">
      {fileList}
      <div className="bo-files-layout__preview-pane">
        <div className="bo-files-layout__toolbar">
          <div className="bo-files-layout__toolbar-row">
            <label className={`bo-files-layout__file-label ${!canEdit ? 'bo-files-layout__file-label--disabled' : ''}`}>
              <span className="bo-files-layout__file-btn">Wybierz plik</span>
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                className="bo-files-layout__file-input"
                disabled={!canEdit}
                onChange={onPickFile}
              />
            </label>
            {localFile && isImageMime(localFile.type) ? (
              <button
                type="button"
                className="dash-table__btn"
                disabled={!canEdit || ocrLoading}
                onClick={() => runOcrOnFile(localFile)}
              >
                Ponów OCR
              </button>
            ) : null}
            <button
              type="button"
              className="dash__btn-primary bo-files-layout__upload-btn"
              disabled={!canEdit || !localFile || uploading}
              onClick={() => uploadCurrentFile()}
            >
              {uploading ? 'Wgrywanie…' : 'Wgraj do Cloudinary'}
            </button>
          </div>
          {ocrLoading ? <p className="bo-files-layout__ocr-status">Odczyt OCR…</p> : null}
          {ocrMsg ? <p className="bo-files-layout__ocr-msg dash-muted">{ocrMsg}</p> : null}
        </div>

        <div
          className={`bo-files-layout__viewport bo-files-layout__viewport--narrow ${previewIsPdf || savedViewportPdf ? 'bo-files-layout__viewport--pdf' : ''}`}
          aria-label="Podgląd dokumentu"
        >
          {previewIsImage ? (
            <div key={previewStableKey} className="bo-files-layout__viewport-inner">
              <img src={previewUrl} alt="Podgląd dokumentu — przewijaj aby zobaczyć całość" className="bo-files-layout__img" />
            </div>
          ) : null}
          {previewIsPdf ? (
            <PdfInlineViewer key={previewStableKey} url={previewUrl} title="Podgląd PDF (lokalny)" />
          ) : null}
          {savedViewportImage && focusedSaved ? (
            <div key={previewStableKey} className="bo-files-layout__viewport-inner">
              <img
                src={focusedSaved.secure_url}
                alt={focusedSaved.original_filename || 'Wgrany dokument'}
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
              Wybierz plik — po wgraniu pojawi się tutaj i na liście po lewej.
            </p>
          ) : null}
        </div>
      </div>

      <aside className="bo-files-layout__side" aria-labelledby="bo-files-ocr-form">
        <div className="bo-files-layout__side-inner">
          <h3 id="bo-files-ocr-form" className="dash-code-modal__card-title" style={{ margin: '0 0 0.65rem' }}>
            Tekst OCR i dane
          </h3>
          <label htmlFor="bo-ocr-text" className="dash-muted bo-files-layout__label">
            Rozpoznany / edytowalny tekst
          </label>
          <textarea
            id="bo-ocr-text"
            className="dash-infolinia-mini-input bo-files-layout__ocr-textarea"
            value={ocrText}
            readOnly={!canEdit}
            onChange={(e) => setOcrText(e.target.value)}
            placeholder="Tekst z OCR lub wpisany ręcznie z dokumentu…"
          />

          <p className="dash-infolinia-mini-caption">Dane klienta</p>
          <table className="dash-infolinia-mini-table">
            <tbody>
              <tr>
                <th scope="row">
                  <span className="dash-infolinia-mini-th">
                    <IconUser size={14} aria-hidden />
                    Imię i nazwisko
                  </span>
                </th>
                <td>
                  <input
                    className="dash-infolinia-mini-input"
                    type="text"
                    autoComplete="name"
                    readOnly={!canEdit}
                    value={clientFullName}
                    onChange={(e) => setClientFullName(e.target.value)}
                    placeholder="np. Jan Kowalski"
                  />
                </td>
              </tr>
              <tr className="dash-infolinia-mini-table__subhead">
                <td colSpan={2}>
                  <span className="dash-infolinia-mini-sub">
                    <IconHome size={14} aria-hidden />
                    Adres
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <span className="dash-infolinia-mini-th">
                    <IconLand size={14} aria-hidden />
                    Ulica
                  </span>
                </th>
                <td>
                  <input
                    className="dash-infolinia-mini-input"
                    type="text"
                    readOnly={!canEdit}
                    value={residenceStreet}
                    onChange={(e) => setResidenceStreet(e.target.value)}
                    placeholder="np. ul. Przykładowa 12"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <span className="dash-infolinia-mini-th">
                    <IconHash size={14} aria-hidden />
                    Kod pocztowy
                  </span>
                </th>
                <td>
                  <input
                    className="dash-infolinia-mini-input"
                    type="text"
                    readOnly={!canEdit}
                    value={residencePostalCode}
                    onChange={(e) => setResidencePostalCode(e.target.value)}
                    placeholder="np. 00-000"
                  />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <span className="dash-infolinia-mini-th">
                    <IconMapPin size={14} aria-hidden />
                    Miejscowość
                  </span>
                </th>
                <td>
                  <input
                    className="dash-infolinia-mini-input"
                    type="text"
                    readOnly={!canEdit}
                    value={residenceCity}
                    onChange={(e) => setResidenceCity(e.target.value)}
                    placeholder="np. Warszawa"
                  />
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="dash-infolinia-mini-table__actions">
                  <button
                    type="button"
                    className="dash__btn-primary dash-infolinia-mini-save"
                    disabled={!canEdit || savingClient}
                    onClick={onSaveClient}
                  >
                    {savingClient ? 'Zapisywanie…' : 'Zapisz dane klienta'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <label htmlFor="bo-backoffice-notes" className="dash-muted bo-files-layout__label" style={{ marginTop: '0.85rem' }}>
            Notatka back office
          </label>
          <textarea
            id="bo-backoffice-notes"
            className="dash-infolinia-mini-input bo-files-layout__bo-notes"
            value={backofficeNotes}
            readOnly={!canEdit}
            onChange={(e) => setBackofficeNotes(e.target.value)}
            placeholder="Wewnętrzna notatka przy tej umowie (osobno od notatek infolinii)…"
            rows={4}
          />

          <div className="bo-files-layout__bo-actions">
            <p className="dash-muted bo-files-layout__bo-status">
              Status BO: <strong>{boStatus === 'zweryfikowany' ? 'zweryfikowany' : 'niezweryfikowany'}</strong>
            </p>
            <button
              type="button"
              className="dash__btn-primary"
              disabled={!canEdit || savingBo || boStatus === 'zweryfikowany'}
              onClick={setBoVerified}
            >
              {savingBo ? 'Zapisywanie…' : 'Oznacz jako zweryfikowany (BO)'}
            </button>
            {boStatus === 'zweryfikowany' ? (
              <p className="dash-muted" style={{ margin: '0.5rem 0 0', fontSize: '0.82rem' }}>
                Umowa jest już zweryfikowana w back office.
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
