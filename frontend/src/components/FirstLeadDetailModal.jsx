import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  getAgentDisplay,
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getRzeczoznawcaStatusValue,
  getVerificationLabel,
  hasVerificationColumn,
  RZECZOZNAWCA_STATUS_OPTIONS,
  rzeczoznawcaStatusPillClass,
} from '../lib/firstLeadDisplay'
import { useAuth } from '../auth/AuthProvider'
import {
  clearModalSession,
  readModalSession,
  writeModalSession,
} from '../lib/firstLeadModalSession'
import { formatFirstLeadSchemaError } from '../lib/firstLeadQueries'
import { supabase } from '../lib/supabase'
import { FirstLeadBackofficeFilesTab } from './FirstLeadBackofficeFilesTab'
import { FirstLeadUmowaFilesSection } from './FirstLeadUmowaFilesSection'
import { RzeczoznawcaWycenaTab } from './RzeczoznawcaWycenaTab'
import {
  IconCalculator,
  IconClock,
  IconCoins,
  IconDroplet,
  IconFileText,
  IconFlame,
  IconHash,
  IconHome,
  IconKey,
  IconLand,
  IconMapPin,
  IconPole,
  IconTag,
  IconUser,
  IconX,
  IconZap,
} from './icons/CodeModalIcons'

const CC_LABELS = {
  code: 'Kod',
  client_id: 'ID klienta',
  parcel_type: 'Typ działki',
  land_value: 'Wartość gruntu',
  pole_type: 'Typ słupa',
  pole_length_m: 'Długość linii (m)',
  area_km2: 'Powierzchnia (km²)',
  pole_count: 'Liczba słupów',
  water_type: 'Rodzaj wodociągu',
  water_length_m: 'Woda — długość (m)',
  water_m2: 'Woda (m²)',
  gas_length_m: 'Gaz — długość (m)',
  gas_type: 'Typ gazu',
  gas_m2: 'Gaz (m²)',
  area_m2: 'Powierzchnia (m²)',
  network_operator: 'Operator sieci',
  network_operator_other: 'Operator (wpis własny)',
  total_price_from: 'Cena całkowita od',
  total_price_to: 'Cena całkowita do',
  power_price_from: 'Energia — cena od',
  power_price_to: 'Energia — cena do',
  water_price_from: 'Woda — cena od',
  water_price_to: 'Woda — cena do',
  gas_price_from: 'Gaz — cena od',
  gas_price_to: 'Gaz — cena do',
  updated_at: 'Aktualizacja (kalkulator)',
  sales_agent_name: 'Handlowiec (w kalkulatorze)',
  sales_agent_number: 'Numer handlowca',
}

/** Kolejność wierszy jak w podglądzie kalkulatora (client_id i *_price_to scalane osobno) */
const CC_KEY_ORDER = [
  'code',
  'parcel_type',
  'land_value',
  'network_operator',
  'network_operator_other',
  'pole_type',
  'pole_length_m',
  'area_km2',
  'pole_count',
  'water_type',
  'water_length_m',
  'water_m2',
  'gas_length_m',
  'gas_type',
  'total_price_from',
  'power_price_from',
  'water_price_from',
  'gas_price_from',
  'updated_at',
  'sales_agent_name',
  'sales_agent_number',
  'gas_m2',
  'area_m2',
]

const PRICE_OD_DO = [
  {
    from: 'total_price_from',
    to: 'total_price_to',
    rowKey: 'total_price_od_do',
    label: 'Cena całkowita',
    iconKey: 'total_price_from',
  },
  {
    from: 'power_price_from',
    to: 'power_price_to',
    rowKey: 'power_price_od_do',
    label: 'Energia — cena',
    iconKey: 'power_price_from',
  },
  {
    from: 'water_price_from',
    to: 'water_price_to',
    rowKey: 'water_price_od_do',
    label: 'Woda — cena',
    iconKey: 'water_price_from',
  },
  {
    from: 'gas_price_from',
    to: 'gas_price_to',
    rowKey: 'gas_price_od_do',
    label: 'Gaz — cena',
    iconKey: 'gas_price_from',
  },
]

function formatOdDoLine(map, fromK, toK) {
  const fa = fmtVal(map[fromK])
  const fb = fmtVal(map[toK])
  if (fa === '—' && fb === '—') return '—'
  if (fb === '—') return fa === '—' ? '—' : fa
  if (fa === '—') return fb
  if (fa === fb) return fa
  return `${fa}-${fb}`
}

/**
 * Jedna linia „Kod” (code + client_id), zakresy cen jako „X-Y”.
 */
function buildCalcDisplayRows(cc) {
  const entries = Object.entries(cc).filter(([k]) => k !== 'payload')
  const map = Object.fromEntries(entries)
  const used = new Set()
  const rows = []

  const addRow = (rowKey, label, valueStr, iconSourceKey) => {
    rows.push({
      key: rowKey,
      label,
      value: valueStr,
      Icon: getCalcFieldIcon(iconSourceKey),
    })
  }

  for (const k of CC_KEY_ORDER) {
    if (used.has(k)) continue

    if (k === 'code') {
      used.add('code')
      used.add('client_id')
      const vc = fmtVal(map.code)
      const vi = fmtVal(map.client_id)
      let val = vc
      if (vc === '—' && vi !== '—') val = vi
      else if (vc !== '—' && vi !== '—' && String(map.code ?? '') !== String(map.client_id ?? ''))
        val = `${vc} (ID: ${vi})`
      addRow('code', 'Kod', val, 'code')
      continue
    }

    const pair = PRICE_OD_DO.find((p) => p.from === k)
    if (pair) {
      used.add(pair.from)
      used.add(pair.to)
      addRow(pair.rowKey, pair.label, formatOdDoLine(map, pair.from, pair.to), pair.iconKey)
      continue
    }

    if (map[k] === undefined) continue
    used.add(k)
    addRow(k, CC_LABELS[k] ?? k, fmtVal(map[k]), k)
  }

  const rest = entries
    .filter(([key]) => !used.has(key) && key !== 'water_mk2')
    .sort(([a], [b]) => a.localeCompare(b))
  for (const [key, v] of rest) {
    addRow(key, CC_LABELS[key] ?? key, fmtVal(v), key)
  }

  return rows
}

function getCalcFieldIcon(key) {
  if (key === 'code') return IconKey
  if (key === 'parcel_type' || key === 'land_value' || key === 'area_km2' || key === 'area_m2')
    return IconLand
  if (key === 'network_operator' || key === 'network_operator_other') return IconZap
  if (key.startsWith('pole_')) return IconPole
  if (key.startsWith('water_')) return IconDroplet
  if (key.startsWith('gas_')) return IconFlame
  if (key.startsWith('power_price_')) return IconZap
  if (key.startsWith('total_price_')) return IconCoins
  if (key === 'updated_at') return IconClock
  if (key === 'sales_agent_name' || key === 'sales_agent_number') return IconUser
  return IconHash
}

function formatDt(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function fmtVal(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function normalizeCalculatorCodes(raw) {
  if (!raw) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function VerificationPill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'}>
      {ok ? 'Zweryfikowany' : 'Niezweryfikowany'}
    </span>
  )
}

function BackofficeHeroPill({ status }) {
  const ok = status === 'zweryfikowany'
  return (
    <span className={ok ? 'dash-pill dash-pill--ok' : 'dash-pill dash-pill--neutral'} title="Status back office">
      {ok ? 'BO: zweryfikowany' : 'BO: do obsługi'}
    </span>
  )
}

function DetailRow({ Icon, label, children }) {
  return (
    <div className="dash-code-modal__row">
      <div className="dash-code-modal__row-label">
        <Icon className="dash-code-modal__row-icon" size={16} />
        <span>{label}</span>
      </div>
      <div className="dash-code-modal__row-val">{children}</div>
    </div>
  )
}

export function FirstLeadDetailModal({ open, lead, onClose, onSaved, variant = 'infolinia' }) {
  const location = useLocation()
  const { profile } = useAuth()
  const prezesForeignPreview =
    profile?.role === 'prezes' && !location.pathname.startsWith('/panel/prezes')
  const modalSessionScope = location.pathname
  const sessionHydratedForLeadRef = useRef(null)
  const [draftSessionMsg, setDraftSessionMsg] = useState('')

  const isBackoffice = variant === 'backoffice'
  /** Odczyt bez edycji: handlowiec, dyrektor, rzeczoznawca, mecenas, prezes. */
  const isReadOnlyViewer =
    variant === 'handlowiec' ||
    variant === 'dyrektor' ||
    variant === 'rzeczoznawca' ||
    variant === 'mecenas' ||
    variant === 'prezes'
  const modalReadOnly = isReadOnlyViewer || prezesForeignPreview
  const [boTab, setBoTab] = useState('details')
  const [saving, setSaving] = useState(false)
  const [savingClient, setSavingClient] = useState(false)
  const [savingArchive, setSavingArchive] = useState(false)
  const [saveErr, setSaveErr] = useState(null)
  const [clientFullName, setClientFullName] = useState('')
  const [residenceStreet, setResidenceStreet] = useState('')
  const [residencePostalCode, setResidencePostalCode] = useState('')
  const [residenceCity, setResidenceCity] = useState('')
  const [backofficeNotes, setBackofficeNotes] = useState('')
  const [rzeczoznawcaDraft, setRzeczoznawcaDraft] = useState('dostarczono')
  const [savingRzeczoznawcaStatus, setSavingRzeczoznawcaStatus] = useState(false)
  /** Zakładki w modalu (tylko variant rzeczoznawca): szczegóły umowy | wycena rzeczoznawcy. */
  const [rzeczoznawcaModalTab, setRzeczoznawcaModalTab] = useState('szczegoly')

  useEffect(() => {
    if (!open || !lead) return
    setClientFullName(lead.client_full_name != null ? String(lead.client_full_name) : '')
    const street =
      lead.residence_street != null && String(lead.residence_street).trim() !== ''
        ? String(lead.residence_street)
        : lead.residence_address != null
          ? String(lead.residence_address)
          : ''
    setResidenceStreet(street)
    setResidencePostalCode(
      lead.residence_postal_code != null ? String(lead.residence_postal_code) : '',
    )
    setResidenceCity(lead.residence_city != null ? String(lead.residence_city) : '')
    setBackofficeNotes(lead.backoffice_notes != null ? String(lead.backoffice_notes) : '')
    if (variant === 'rzeczoznawca') {
      setRzeczoznawcaDraft(getRzeczoznawcaStatusValue(lead))
    }
  }, [
    open,
    lead?.id,
    lead?.client_full_name,
    lead?.residence_address,
    lead?.residence_street,
    lead?.residence_postal_code,
    lead?.residence_city,
    lead?.backoffice_notes,
    lead?.rzeczoznawca_status,
    variant,
  ])

  useEffect(() => {
    if (open && isBackoffice) setBoTab('details')
  }, [open, isBackoffice, lead?.id])

  useEffect(() => {
    if (!open) {
      sessionHydratedForLeadRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open || !lead?.id) return
    if (sessionHydratedForLeadRef.current === lead.id) return
    const s = readModalSession(modalSessionScope)
    if (s?.leadId === lead.id) {
      if (variant === 'backoffice' && (s.boTab === 'pliki' || s.boTab === 'details')) {
        setBoTab(s.boTab)
      }
      if (
        (variant === 'rzeczoznawca' || variant === 'mecenas' || variant === 'prezes') &&
        (s.rzeczoznawcaModalTab === 'szczegoly' || s.rzeczoznawcaModalTab === 'rzeczoznawca')
      ) {
        setRzeczoznawcaModalTab(s.rzeczoznawcaModalTab)
      }
    } else {
      if (variant === 'rzeczoznawca' || variant === 'mecenas' || variant === 'prezes')
        setRzeczoznawcaModalTab('szczegoly')
      if (variant === 'backoffice') setBoTab('details')
    }
    sessionHydratedForLeadRef.current = lead.id
  }, [open, lead?.id, modalSessionScope, variant])

  useEffect(() => {
    if (!open || !lead?.id) return
    writeModalSession(modalSessionScope, {
      leadId: lead.id,
      boTab,
      rzeczoznawcaModalTab,
      variant,
    })
  }, [open, lead?.id, boTab, rzeczoznawcaModalTab, modalSessionScope, variant])

  useEffect(() => {
    if (!open) return
    setSaveErr(null)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || !lead) return null

  const showRzeczDualTabs = variant === 'rzeczoznawca' || variant === 'mecenas' || variant === 'prezes'

  const cc = normalizeCalculatorCodes(lead.calculator_codes)
  const rzFieldsObj =
    lead?.rzeczoznawca_fields && typeof lead.rzeczoznawca_fields === 'object'
      ? lead.rzeczoznawca_fields
      : {}
  const calcDisplayMap =
    cc && typeof cc === 'object'
      ? { ...cc, ...rzFieldsObj }
      : Object.keys(rzFieldsObj).length > 0
        ? { ...rzFieldsObj }
        : null

  const canToggleVerification = hasVerificationColumn(lead)
  const verificationLabel = getVerificationLabel(lead)
  const backofficeLabel = getBackofficeStatusLabel(lead)
  const isArchived = lead.archived_at != null

  async function restoreLead() {
    if (isBackoffice || modalReadOnly || !isArchived) return
    if (!window.confirm('Przywrócić ten wpis na listę kodów (Odczyt kodów)?')) return
    setSaveErr(null)
    setSavingArchive(true)
    const { error } = await supabase.from('first_lead').update({ archived_at: null }).eq('id', lead.id)
    setSavingArchive(false)
    if (error) {
      setSaveErr(formatFirstLeadSchemaError(error))
      return
    }
    onSaved?.()
    onClose()
  }

  async function toggleVerification() {
    if (isBackoffice || modalReadOnly || !canToggleVerification) return
    setSaveErr(null)
    const current = lead.verification_status
    const next =
      current === 'zweryfikowany' ? 'niezweryfikowany' : 'zweryfikowany'
    setSaving(true)
    const { data: authData } = await supabase.auth.getUser()
    const uid = authData?.user?.id ?? null
    const nowIso = new Date().toISOString()
    const patch =
      next === 'zweryfikowany'
        ? {
            verification_status: next,
            verified_by: uid,
            verified_at: nowIso,
            archived_at: nowIso,
            backoffice_status: 'niezweryfikowany',
          }
        : {
            verification_status: next,
            verified_by: null,
            verified_at: null,
            archived_at: null,
          }
    const { error } = await supabase.from('first_lead').update(patch).eq('id', lead.id)
    setSaving(false)
    if (error) {
      setSaveErr(formatFirstLeadSchemaError(error))
      return
    }
    onSaved?.()
    onClose()
  }

  async function saveClientFields() {
    if (modalReadOnly) return
    setSaveErr(null)
    setSavingClient(true)
    const patch = {
      client_full_name: clientFullName.trim() || null,
      residence_street: residenceStreet.trim() || null,
      residence_postal_code: residencePostalCode.trim() || null,
      residence_city: residenceCity.trim() || null,
      residence_address: null,
    }
    if (isBackoffice) {
      patch.backoffice_notes = backofficeNotes.trim() || null
    }
    const { error } = await supabase.from('first_lead').update(patch).eq('id', lead.id)
    setSavingClient(false)
    if (error) {
      setSaveErr(formatFirstLeadSchemaError(error))
      return
    }
    onSaved?.()
  }

  async function saveRzeczoznawcaStatus() {
    if (prezesForeignPreview) return
    if (variant !== 'rzeczoznawca' || !lead?.id) return
    if (!RZECZOZNAWCA_STATUS_OPTIONS.includes(rzeczoznawcaDraft)) return
    setSaveErr(null)
    setSavingRzeczoznawcaStatus(true)
    const { error } = await supabase
      .from('first_lead')
      .update({ rzeczoznawca_status: rzeczoznawcaDraft })
      .eq('id', lead.id)
    setSavingRzeczoznawcaStatus(false)
    if (error) {
      setSaveErr(formatFirstLeadSchemaError(error))
      return
    }
    onSaved?.()
  }

  function flushModalSession() {
    if (!lead?.id) return
    writeModalSession(modalSessionScope, {
      leadId: lead.id,
      boTab,
      rzeczoznawcaModalTab,
      variant,
    })
  }

  async function saveDraftVersion() {
    if (!lead?.id) return
    setSaveErr(null)
    flushModalSession()
    setDraftSessionMsg('Zapisano wersję roboczą — po odświeżeniu wrócisz do tego widoku.')
    window.setTimeout(() => setDraftSessionMsg(''), 4500)
    if (!modalReadOnly) {
      await saveClientFields()
    }
  }

  function handleExit() {
    clearModalSession(modalSessionScope)
    setDraftSessionMsg('')
    onClose()
  }

  function handleDismiss() {
    onClose()
  }

  const agentLine = getAgentDisplay(lead)
  const dateLabel = lead.code_generated_at ? 'Data wygenerowania kodu' : 'Data kodu'

  const calcEntries = calcDisplayMap ? buildCalcDisplayRows(calcDisplayMap) : null

  const showUmowaFilesSection =
    (showRzeczDualTabs && rzeczoznawcaModalTab === 'szczegoly') ||
    variant === 'handlowiec' ||
    variant === 'dyrektor' ||
    (variant === 'backoffice' && boTab === 'details')

  const canEditUmowaFiles =
    variant === 'rzeczoznawca' && rzeczoznawcaModalTab === 'szczegoly' && !prezesForeignPreview

  return (
    <div
      className="dash-modal-backdrop dash-modal-backdrop--fullscreen"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss()
      }}
    >
      <div
        className="dash-modal dash-modal--fullscreen dash-code-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-code-modal-title"
      >
        <header className="dash-code-modal__head">
          <div className="dash-code-modal__head-top">
            <h2 id="first-code-modal-title" className="dash-code-modal__head-title">
              <IconKey size={22} />
              {isBackoffice ? 'Umowa' : modalReadOnly ? 'Podgląd umowy' : 'Szczegóły kodu'}
            </h2>
            <div className="dash-code-modal__head-actions">
              <button
                type="button"
                className="dash-code-modal__draft-btn"
                onClick={() => saveDraftVersion()}
                disabled={savingClient || saving || savingArchive}
              >
                {savingClient ? 'Zapisywanie…' : 'Zapisz wersję roboczą'}
              </button>
              <button type="button" className="dash-code-modal__exit-btn" onClick={handleExit}>
                Wyjdź
              </button>
              <button type="button" className="dash-code-modal__close" onClick={handleDismiss} aria-label="Zamknij">
                <IconX size={22} />
              </button>
            </div>
          </div>
          {draftSessionMsg ? (
            <p className="dash-code-modal__draft-saved-msg" role="status">
              {draftSessionMsg}
            </p>
          ) : null}
          <div className="dash-code-modal__hero">
            <div className="dash-code-modal__hero-icon" aria-hidden>
              <IconKey size={28} />
            </div>
            <div className="dash-code-modal__hero-text">
              <p className="dash-code-modal__eyebrow">Kod kalkulatora</p>
              <p className="dash-code-modal__code-big">{lead.calculator_code ?? '—'}</p>
            </div>
            {isBackoffice ? (
              <BackofficeHeroPill status={backofficeLabel} />
            ) : (
              <div className="dash-code-modal__hero-status-group">
                <VerificationPill status={verificationLabel} />
                {variant === 'rzeczoznawca' && !prezesForeignPreview ? (
                  <>
                    <label htmlFor="modal-rzeczoznawca-status-hero" className="visually-hidden">
                      Status rzeczoznawcy
                    </label>
                    <select
                      id="modal-rzeczoznawca-status-hero"
                      className="dash-code-modal__hero-rzecz-select"
                      value={rzeczoznawcaDraft}
                      onChange={(e) => setRzeczoznawcaDraft(e.target.value)}
                      disabled={savingRzeczoznawcaStatus}
                      aria-label="Status rzeczoznawcy"
                    >
                      {RZECZOZNAWCA_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="dash__btn-primary dash-code-modal__hero-rzecz-save"
                      onClick={() => saveRzeczoznawcaStatus()}
                      disabled={
                        savingRzeczoznawcaStatus ||
                        rzeczoznawcaDraft === getRzeczoznawcaStatusValue(lead)
                      }
                    >
                      {savingRzeczoznawcaStatus ? 'Zapisywanie…' : 'Zapisz status'}
                    </button>
                  </>
                ) : variant === 'mecenas' ||
                  variant === 'prezes' ||
                  (variant === 'rzeczoznawca' && prezesForeignPreview) ? (
                  <span
                    className={rzeczoznawcaStatusPillClass(getRzeczoznawcaStatusValue(lead))}
                    title="Status rzeczoznawcy (tylko odczyt)"
                  >
                    {getRzeczoznawcaStatusValue(lead)}
                  </span>
                ) : null}
              </div>
            )}
          </div>
          {isBackoffice ? (
            <div
              style={{ marginTop: '0.85rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}
              role="tablist"
              aria-label="Widok umowy"
            >
              <button
                type="button"
                role="tab"
                aria-selected={boTab === 'details'}
                className={boTab === 'details' ? 'dash__tab dash__tab--active' : 'dash__tab'}
                onClick={() => setBoTab('details')}
              >
                Szczegóły
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={boTab === 'pliki'}
                className={boTab === 'pliki' ? 'dash__tab dash__tab--active' : 'dash__tab'}
                onClick={() => setBoTab('pliki')}
              >
                Dodaj pliki
              </button>
            </div>
          ) : null}
          {showRzeczDualTabs ? (
            <div
              style={{ marginTop: '0.85rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}
              role="tablist"
              aria-label={
                variant === 'mecenas'
                  ? 'Widok mecenasa'
                  : variant === 'prezes'
                    ? 'Widok prezesa'
                    : 'Widok rzeczoznawcy'
              }
            >
              <button
                type="button"
                role="tab"
                aria-selected={rzeczoznawcaModalTab === 'szczegoly'}
                className={
                  rzeczoznawcaModalTab === 'szczegoly' ? 'dash__tab dash__tab--active' : 'dash__tab'
                }
                onClick={() => setRzeczoznawcaModalTab('szczegoly')}
              >
                Szczegóły umowy
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rzeczoznawcaModalTab === 'rzeczoznawca'}
                className={
                  rzeczoznawcaModalTab === 'rzeczoznawca' ? 'dash__tab dash__tab--active' : 'dash__tab'
                }
                onClick={() => setRzeczoznawcaModalTab('rzeczoznawca')}
              >
                Rzeczoznawca
              </button>
            </div>
          ) : null}
        </header>

        <div
          className={
            isBackoffice && boTab === 'pliki'
              ? 'dash-code-modal__body dash-code-modal__body--bo-files'
              : showRzeczDualTabs && rzeczoznawcaModalTab === 'rzeczoznawca'
                ? 'dash-code-modal__body dash-code-modal__body--rzeczoznawca-embed'
                : 'dash-code-modal__body'
          }
        >
          {isBackoffice && boTab === 'pliki' ? (
            <>
              <FirstLeadBackofficeFilesTab
                lead={lead}
                onSaved={onSaved}
                setSaveErr={setSaveErr}
                canEdit={!prezesForeignPreview}
                clientFullName={clientFullName}
                setClientFullName={setClientFullName}
                residenceStreet={residenceStreet}
                setResidenceStreet={setResidenceStreet}
                residencePostalCode={residencePostalCode}
                setResidencePostalCode={setResidencePostalCode}
                residenceCity={residenceCity}
                setResidenceCity={setResidenceCity}
                backofficeNotes={backofficeNotes}
                setBackofficeNotes={setBackofficeNotes}
                onSaveClient={saveClientFields}
                savingClient={savingClient}
              />
              {saveErr ? (
                <p className="error bo-files-layout__err" style={{ whiteSpace: 'pre-line' }}>
                  {saveErr}
                </p>
              ) : null}
            </>
          ) : showRzeczDualTabs && rzeczoznawcaModalTab === 'rzeczoznawca' ? (
            <RzeczoznawcaWycenaTab
              lead={lead}
              onSaved={onSaved}
              setSaveErr={setSaveErr}
              readOnly={variant === 'mecenas' || variant === 'prezes' || prezesForeignPreview}
            />
          ) : (
            <>
          <div className={`dash-code-modal__grid ${cc ? 'dash-code-modal__grid--split' : ''}`}>
            <section className="dash-code-modal__card" aria-labelledby="code-modal-infolinia">
              <div className="dash-code-modal__card-head">
                <div className="dash-code-modal__card-icon" aria-hidden>
                  <IconFileText size={18} />
                </div>
                <h3 id="code-modal-infolinia" className="dash-code-modal__card-title">
                  Infolinia
                </h3>
              </div>
              {isArchived ? (
                <DetailRow Icon={IconClock} label="Zarchiwizowano">
                  {formatDt(lead.archived_at)}
                </DetailRow>
              ) : null}
              <DetailRow Icon={IconHash} label="ID">
                {fmtVal(lead.id)}
              </DetailRow>
              <DetailRow Icon={IconKey} label="Kod (calculator)">
                {fmtVal(lead.calculator_code)}
              </DetailRow>
              <DetailRow Icon={IconClock} label={dateLabel}>
                {formatDt(getCodeTimestamp(lead))}
              </DetailRow>
              <DetailRow Icon={IconUser} label="Handlowiec">
                {fmtVal(agentLine)}
              </DetailRow>
              <DetailRow Icon={IconFileText} label="Notatki">
                {fmtVal(lead.notes)}
              </DetailRow>
              {isBackoffice ? (
                <DetailRow Icon={IconFileText} label="Notatka BO">
                  {fmtVal(lead.backoffice_notes)}
                </DetailRow>
              ) : null}
              {isBackoffice && lead.backoffice_archived_at ? (
                <DetailRow Icon={IconClock} label="Archiwum BO">
                  {formatDt(lead.backoffice_archived_at)}
                </DetailRow>
              ) : null}
              {modalReadOnly && !isBackoffice ? (
                <>
                  <DetailRow Icon={IconTag} label="Status BO (umowa)">
                    {getBackofficeStatusLabel(lead) === 'zweryfikowany'
                      ? 'zweryfikowany'
                      : 'niezweryfikowany / w toku'}
                  </DetailRow>
                  {lead.backoffice_archived_at ? (
                    <DetailRow Icon={IconClock} label="Archiwum BO">
                      {formatDt(lead.backoffice_archived_at)}
                    </DetailRow>
                  ) : null}
                </>
              ) : null}
              <DetailRow Icon={IconTag} label="Status (pole status)">
                {fmtVal(lead.status)}
              </DetailRow>
              {verificationLabel === 'zweryfikowany' ? (
                <>
                  <DetailRow Icon={IconUser} label="Zweryfikowano przez (user id)">
                    {fmtVal(lead.verified_by)}
                  </DetailRow>
                  <DetailRow Icon={IconClock} label="Data weryfikacji">
                    {lead.verified_at ? formatDt(lead.verified_at) : '—'}
                  </DetailRow>
                </>
              ) : null}
              <DetailRow Icon={IconClock} label="Utworzono">
                {formatDt(lead.created_at)}
              </DetailRow>
              <DetailRow Icon={IconHash} label="Utworzył (user id)">
                {fmtVal(lead.created_by)}
              </DetailRow>

              <div className="dash-infolinia-mini-wrap">
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
                          id="client-full-name"
                          className="dash-infolinia-mini-input"
                          type="text"
                          autoComplete="name"
                          readOnly={modalReadOnly}
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
                          Adres zamieszkania
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">
                        <span className="dash-infolinia-mini-th">
                          <IconLand size={14} aria-hidden />
                          Ulica i numer
                        </span>
                      </th>
                      <td>
                        <input
                          id="client-residence-street"
                          className="dash-infolinia-mini-input"
                          type="text"
                          autoComplete="street-address"
                          readOnly={modalReadOnly}
                          value={residenceStreet}
                          onChange={(e) => setResidenceStreet(e.target.value)}
                          placeholder="np. ul. Przykładowa 12 / 4"
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
                          id="client-residence-postal"
                          className="dash-infolinia-mini-input"
                          type="text"
                          autoComplete="postal-code"
                          inputMode="text"
                          readOnly={modalReadOnly}
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
                          id="client-residence-city"
                          className="dash-infolinia-mini-input"
                          type="text"
                          autoComplete="address-level2"
                          readOnly={modalReadOnly}
                          value={residenceCity}
                          onChange={(e) => setResidenceCity(e.target.value)}
                          placeholder="np. Warszawa"
                        />
                      </td>
                    </tr>
                    {!modalReadOnly ? (
                      <tr>
                        <td colSpan={2} className="dash-infolinia-mini-table__actions">
                          <button
                            type="button"
                            className="dash__btn-primary dash-infolinia-mini-save"
                            onClick={saveClientFields}
                            disabled={savingClient}
                          >
                            {savingClient ? 'Zapisywanie…' : 'Zapisz dane klienta'}
                          </button>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </section>

            {cc ? (
              <section className="dash-code-modal__card dash-code-modal__card--calc" aria-labelledby="code-modal-calc">
                <div className="dash-code-modal__card-head">
                  <div className="dash-code-modal__card-icon dash-code-modal__card-icon--calc" aria-hidden>
                    <IconCalculator size={18} />
                  </div>
                  <h3 id="code-modal-calc" className="dash-code-modal__card-title">
                    Dane z kalkulatora
                  </h3>
                </div>
                <div className="dash-calc-sheet" role="list">
                  {calcEntries.map(({ key, label, value, Icon }) => (
                    <div key={key} className="dash-calc-sheet__row" role="listitem">
                      <div className="dash-calc-sheet__label">
                        <Icon className="dash-calc-sheet__label-icon" size={15} />
                        <span>{label}</span>
                      </div>
                      <div className="dash-calc-sheet__value">{value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="dash-code-modal__card dash-code-modal__card--muted" aria-labelledby="code-modal-no-calc">
                <div className="dash-code-modal__card-head">
                  <div className="dash-code-modal__card-icon" aria-hidden>
                    <IconCalculator size={18} />
                  </div>
                  <h3 id="code-modal-no-calc" className="dash-code-modal__card-title">
                    Kalkulator
                  </h3>
                </div>
                <p className="dash-muted" style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Brak powiązanego rekordu w <code>calculator_codes</code> dla kodu{' '}
                  <code>{lead.calculator_code ?? '—'}</code>.
                </p>
              </section>
            )}
          </div>

          {showUmowaFilesSection ? (
            <section
              className="dash-code-modal__card dash-umowa-files-wrap"
              aria-labelledby="umowa-files-heading"
              style={{ marginTop: '1rem' }}
            >
              <div className="dash-code-modal__card-head">
                <div className="dash-code-modal__card-icon" aria-hidden>
                  <IconFileText size={18} />
                </div>
                <h3 id="umowa-files-heading" className="dash-code-modal__card-title">
                  Pliki umowy
                </h3>
              </div>
              <FirstLeadUmowaFilesSection
                lead={lead}
                onSaved={onSaved}
                setSaveErr={setSaveErr}
                canEdit={canEditUmowaFiles}
              />
            </section>
          ) : null}

          {!isBackoffice && !modalReadOnly && !canToggleVerification ? (
            <p className="dash-code-modal__hint">
              Aby zmieniać weryfikację z panelu, uruchom migrację z kolumną{' '}
              <code>verification_status</code> (<code>20260323140000_first_lead.sql</code>).
            </p>
          ) : null}
          {!isBackoffice && !modalReadOnly && canToggleVerification && !isArchived && verificationLabel !== 'zweryfikowany' ? (
            <p className="dash-code-modal__hint" style={{ marginTop: '0.35rem' }}>
              Po oznaczeniu jako zweryfikowany wpis znika z listy KODY i trafia do Archiwum (można przywrócić). W back
              office ustawiany jest status BO: <strong>niezweryfikowany</strong> (osobna ścieżka od infolinii).
            </p>
          ) : null}
          {modalReadOnly && variant !== 'rzeczoznawca' && variant !== 'mecenas' && variant !== 'prezes' ? (
            <p className="dash-code-modal__hint" style={{ marginTop: '0.35rem' }}>
              Widok tylko do odczytu. Zmiany wykonuje infolinia lub back office.
            </p>
          ) : null}
          {variant === 'rzeczoznawca' ? (
            <p className="dash-code-modal__hint" style={{ marginTop: '0.35rem' }}>
              {prezesForeignPreview ? (
                <>
                  Tryb podglądu prezesa — <strong>bez zapisu</strong>: dane klienta, pliki umowy, status i wycena rzeczoznawcy
                  są tylko do odczytu.
                </>
              ) : (
                <>
                  Dane klienta i arkusz z kalkulatora (infolinia) — tylko do odczytu. W sekcji <strong>Pliki umowy</strong>{' '}
                  możesz dodawać załączniki (PDF / obraz, Cloudinary). <strong>Status rzeczoznawcy</strong> w nagłówku.
                  Zakładka <strong>Rzeczoznawca</strong> — osobna wycena w <code>rzeczoznawca_fields</code>.
                </>
              )}
            </p>
          ) : null}
          {variant === 'mecenas' || variant === 'prezes' ? (
            <p className="dash-code-modal__hint" style={{ marginTop: '0.35rem' }}>
              {variant === 'prezes' ? (
                <>
                  Widok prezesa — <strong>bez zapisu</strong>: pełny podgląd jak w obiegu rzeczoznawcy / kancelarii, bez
                  zmian w bazie.
                </>
              ) : (
                <>
                  Widok kancelarii — <strong>bez zapisu</strong>: status rzeczoznawcy, pliki umowy i arkusz wyceny są
                  tylko do podglądu.
                </>
              )}
            </p>
          ) : null}

          {saveErr ? (
            <p className="error" style={{ marginTop: '0.75rem', whiteSpace: 'pre-line' }}>
              {saveErr}
            </p>
          ) : null}
            </>
          )}
        </div>

        {!isBackoffice && !modalReadOnly && ((!isArchived && canToggleVerification) || isArchived) ? (
          <footer
            className={isArchived ? 'dash-code-modal__foot dash-code-modal__foot--split' : 'dash-code-modal__foot'}
          >
            {isArchived ? (
              <div className="dash-code-modal__foot-start">
                <button
                  type="button"
                  className="dash__btn-primary"
                  onClick={restoreLead}
                  disabled={savingArchive || saving || savingClient}
                >
                  {savingArchive ? 'Przywracanie…' : 'Przywróć z archiwum'}
                </button>
              </div>
            ) : null}
            {!isArchived && canToggleVerification ? (
              <button
                type="button"
                className="dash__btn-primary"
                onClick={toggleVerification}
                disabled={saving || savingClient || savingArchive}
              >
                {saving
                  ? 'Zapisywanie…'
                  : verificationLabel === 'zweryfikowany'
                    ? 'Oznacz jako niezweryfikowany'
                    : 'Oznacz jako zweryfikowany'}
              </button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  )
}
