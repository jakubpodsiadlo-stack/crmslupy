import { useEffect, useState } from 'react'
import { formatFirstLeadSchemaError } from '../lib/firstLeadQueries'
import {
  buildRzeczoznawcaDraftFromLead,
  draftToRzeczoznawcaFieldsPayload,
  RZECZOZNAWCA_GAS_OPTIONS,
  RZECZOZNAWCA_LABELS,
  RZECZOZNAWCA_NETWORK_OPERATOR_OPTIONS,
  RZECZOZNAWCA_WATER_OPTIONS,
  RZECZOZNAWCA_PARCEL_OPTIONS,
  RZECZOZNAWCA_POLE_OPTIONS,
  RZECZOZNAWCA_SECTIONS,
  RZECZOZNAWCA_TOTAL_PRICE,
} from '../lib/rzeczoznawcaFields'
import { getKalkulatorNoCodeEmbedSrc } from '../lib/kalkulatorEmbedUrl'
import { supabase } from '../lib/supabase'
import {
  IconCalculator,
  IconCoins,
  IconDroplet,
  IconFlame,
  IconHash,
  IconLand,
  IconPole,
  IconZap,
} from './icons/CodeModalIcons'

const SECTION_HEAD_ICONS = {
  parcel: IconLand,
  energy: IconZap,
  water: IconDroplet,
  gas: IconFlame,
}

function getRzeczFieldIcon(key) {
  if (key === 'parcel_type' || key === 'land_value' || key === 'area_km2' || key === 'area_m2')
    return IconLand
  if (key === 'network_operator' || key === 'network_operator_other') return IconZap
  if (key.startsWith('pole_')) return IconPole
  if (key.startsWith('water_')) return IconDroplet
  if (key.startsWith('gas_')) return IconFlame
  if (key.startsWith('power_price_')) return IconZap
  if (key.startsWith('total_price_')) return IconCoins
  return IconHash
}

function priceIconForSectionId(id) {
  if (id === 'energy') return IconZap
  if (id === 'water') return IconDroplet
  if (id === 'gas') return IconFlame
  return IconCoins
}

/**
 * Zakładka „Rzeczoznawca”: wycena zapisywana w first_lead.rzeczoznawca_fields (osobno od danych infolinii).
 */
export function RzeczoznawcaWycenaTab({ lead, onSaved, setSaveErr, readOnly = false }) {
  const [draft, setDraft] = useState(() => buildRzeczoznawcaDraftFromLead(lead))
  const [saving, setSaving] = useState(false)
  const kalkulatorEmbedSrc = getKalkulatorNoCodeEmbedSrc()

  useEffect(() => {
    if (!lead?.id) return
    setDraft(buildRzeczoznawcaDraftFromLead(lead))
  }, [lead?.id, lead?.rzeczoznawca_fields, lead?.calculator_codes])

  function setField(key, value) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function renderFieldRow(k) {
    const Icon = getRzeczFieldIcon(k)
    const val = draft[k] ?? ''

    if (k === 'network_operator') {
      const legacyOp =
        val && !RZECZOZNAWCA_NETWORK_OPERATOR_OPTIONS.some((o) => o.value === val) ? val : null
      return (
        <div key={k} className="dash-rzecz-wycena__row">
          <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
            <Icon className="dash-rzecz-wycena__label-icon" size={15} />
            <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
          </label>
          <select
            id={`rzecz-${k}`}
            className="dash-rzecz-wycena__select"
            value={val}
            onChange={(e) => {
              const v = e.target.value
              setDraft((d) => ({
                ...d,
                network_operator: v,
                ...(v !== 'inne' ? { network_operator_other: '' } : {}),
              }))
            }}
          >
            <option value="">— wybierz —</option>
            {legacyOp ? <option value={legacyOp}>{legacyOp}</option> : null}
            {RZECZOZNAWCA_NETWORK_OPERATOR_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (k === 'network_operator_other') {
      if (String(draft.network_operator ?? '') !== 'inne') return null
      return (
        <div key={k} className="dash-rzecz-wycena__row">
          <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
            <Icon className="dash-rzecz-wycena__label-icon" size={15} />
            <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
          </label>
          <input
            id={`rzecz-${k}`}
            className="dash-rzecz-wycena__input"
            type="text"
            autoComplete="off"
            value={String(draft.network_operator_other ?? '')}
            onChange={(e) => setField(k, e.target.value)}
            placeholder="Nazwa operatora"
          />
        </div>
      )
    }

    if (k === 'parcel_type') {
      return (
        <div key={k} className="dash-rzecz-wycena__row">
          <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
            <Icon className="dash-rzecz-wycena__label-icon" size={15} />
            <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
          </label>
          <select
            id={`rzecz-${k}`}
            className="dash-rzecz-wycena__select"
            value={val}
            onChange={(e) => setField(k, e.target.value)}
          >
            <option value="">— wybierz —</option>
            {RZECZOZNAWCA_PARCEL_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (k === 'pole_type') {
      const legacyPole =
        val && !RZECZOZNAWCA_POLE_OPTIONS.some((o) => o.value === val) ? val : null
      return (
        <div key={k} className="dash-rzecz-wycena__row">
          <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
            <Icon className="dash-rzecz-wycena__label-icon" size={15} />
            <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
          </label>
          <select
            id={`rzecz-${k}`}
            className="dash-rzecz-wycena__select"
            value={val}
            onChange={(e) => setField(k, e.target.value)}
          >
            <option value="">— wybierz —</option>
            {legacyPole ? <option value={legacyPole}>{legacyPole}</option> : null}
            {RZECZOZNAWCA_POLE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (k === 'water_type') {
      const legacyWater =
        val && !RZECZOZNAWCA_WATER_OPTIONS.some((o) => o.value === val) ? val : null
      return (
        <div key={k} className="dash-rzecz-wycena__row">
          <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
            <Icon className="dash-rzecz-wycena__label-icon" size={15} />
            <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
          </label>
          <select
            id={`rzecz-${k}`}
            className="dash-rzecz-wycena__select"
            value={val}
            onChange={(e) => setField(k, e.target.value)}
          >
            <option value="">— wybierz —</option>
            {legacyWater ? <option value={legacyWater}>{legacyWater}</option> : null}
            {RZECZOZNAWCA_WATER_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (k === 'gas_type') {
      const legacyGas =
        val && !RZECZOZNAWCA_GAS_OPTIONS.some((o) => o.value === val) ? val : null
      return (
        <div key={k} className="dash-rzecz-wycena__row">
          <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
            <Icon className="dash-rzecz-wycena__label-icon" size={15} />
            <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
          </label>
          <select
            id={`rzecz-${k}`}
            className="dash-rzecz-wycena__select"
            value={val}
            onChange={(e) => setField(k, e.target.value)}
          >
            <option value="">— wybierz —</option>
            {legacyGas ? <option value={legacyGas}>{legacyGas}</option> : null}
            {RZECZOZNAWCA_GAS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    return (
      <div key={k} className="dash-rzecz-wycena__row">
        <label className="dash-rzecz-wycena__label" htmlFor={`rzecz-${k}`}>
          <Icon className="dash-rzecz-wycena__label-icon" size={15} />
          <span>{RZECZOZNAWCA_LABELS[k] ?? k}</span>
        </label>
        <input
          id={`rzecz-${k}`}
          className="dash-rzecz-wycena__input"
          type="text"
          autoComplete="off"
          value={val}
          onChange={(e) => setField(k, e.target.value)}
        />
      </div>
    )
  }

  function renderSectionPricePair(section) {
    if (!section.priceFrom) return null
    const PriceIcon = priceIconForSectionId(section.id)
    const from = section.priceFrom
    const to = section.priceTo
    const label = section.priceLabel
    return (
      <div
        key={`${section.id}-price`}
        className="dash-rzecz-wycena__row dash-rzecz-wycena__row--pair"
      >
        <div className="dash-rzecz-wycena__label">
          <PriceIcon className="dash-rzecz-wycena__label-icon" size={15} />
          <span>{label}</span>
          <span className="dash-rzecz-wycena__pair-hint">od – do</span>
        </div>
        <div className="dash-rzecz-wycena__pair-inputs">
          <input
            className="dash-rzecz-wycena__input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} — od`}
            value={draft[from] ?? ''}
            onChange={(e) => setField(from, e.target.value)}
            placeholder="od"
          />
          <input
            className="dash-rzecz-wycena__input"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} — do`}
            value={draft[to] ?? ''}
            onChange={(e) => setField(to, e.target.value)}
            placeholder="do"
          />
        </div>
      </div>
    )
  }

  async function save() {
    if (!lead?.id) return
    setSaveErr?.(null)
    setSaving(true)
    const payload = draftToRzeczoznawcaFieldsPayload(draft)
    const { error } = await supabase
      .from('first_lead')
      .update({ rzeczoznawca_fields: payload })
      .eq('id', lead.id)
    setSaving(false)
    if (error) {
      setSaveErr?.(formatFirstLeadSchemaError(error))
      return
    }
    onSaved?.()
  }

  return (
    <div className="dash-rzecz-wycena">
      <div className="dash-rzecz-wycena__head">
        <div className="dash-rzecz-wycena__head-icon" aria-hidden>
          <IconCalculator size={20} />
        </div>
        <div>
          <h3 className="dash-rzecz-wycena__title">Wycena od rzeczoznawcy</h3>
          <p className="dash-rzecz-wycena__subtitle">
            {readOnly ? (
              <>Podgląd danych z kolumny <code>rzeczoznawca_fields</code> — tylko do odczytu.</>
            ) : (
              <>
                Pola poniżej zapisują się w bazie w kolumnie <code>rzeczoznawca_fields</code> (osobno od danych z
                kalkulatora infolinii).
              </>
            )}
          </p>
        </div>
      </div>

      <fieldset
        className="dash-rzecz-wycena__sheet-fieldset"
        disabled={readOnly}
        style={{ border: 'none', margin: 0, padding: 0, minWidth: 0 }}
      >
        <legend className="visually-hidden">
          {readOnly ? 'Wycena rzeczoznawcy (odczyt)' : 'Wycena rzeczoznawcy (edycja)'}
        </legend>
        <div className="dash-rzecz-wycena__sheet">
        {RZECZOZNAWCA_SECTIONS.map((section) => {
          const HeadIcon = SECTION_HEAD_ICONS[section.id] ?? IconHash
          return (
            <section
              key={section.id}
              className="dash-rzecz-wycena__section"
              aria-labelledby={`rzecz-sec-${section.id}`}
            >
              <h4
                id={`rzecz-sec-${section.id}`}
                className={`dash-rzecz-wycena__section-head dash-rzecz-wycena__section-head--${section.id}`}
              >
                <span className="dash-rzecz-wycena__section-head-icon" aria-hidden>
                  <HeadIcon size={17} />
                </span>
                <span className="dash-rzecz-wycena__section-title">{section.title}</span>
              </h4>
              <div className="dash-rzecz-wycena__section-grid">
                {section.keys.map((k) => renderFieldRow(k))}
                {renderSectionPricePair(section)}
              </div>
            </section>
          )
        })}

        <section
          className="dash-rzecz-wycena__section dash-rzecz-wycena__section--total"
          aria-labelledby="rzecz-sec-total"
        >
          <h4 id="rzecz-sec-total" className="dash-rzecz-wycena__section-head dash-rzecz-wycena__section-head--total">
            <span className="dash-rzecz-wycena__section-head-icon" aria-hidden>
              <IconCoins size={17} />
            </span>
            <span className="dash-rzecz-wycena__section-title">Podsumowanie</span>
          </h4>
          <div className="dash-rzecz-wycena__section-grid">
            <div
              className="dash-rzecz-wycena__row dash-rzecz-wycena__row--pair"
            >
              <div className="dash-rzecz-wycena__label">
                <IconCoins className="dash-rzecz-wycena__label-icon" size={15} />
                <span>{RZECZOZNAWCA_TOTAL_PRICE.label}</span>
                <span className="dash-rzecz-wycena__pair-hint">od – do</span>
              </div>
              <div className="dash-rzecz-wycena__pair-inputs">
                <input
                  className="dash-rzecz-wycena__input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={`${RZECZOZNAWCA_TOTAL_PRICE.label} — od`}
                  value={draft[RZECZOZNAWCA_TOTAL_PRICE.from] ?? ''}
                  onChange={(e) => setField(RZECZOZNAWCA_TOTAL_PRICE.from, e.target.value)}
                  placeholder="od"
                />
                <input
                  className="dash-rzecz-wycena__input"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={`${RZECZOZNAWCA_TOTAL_PRICE.label} — do`}
                  value={draft[RZECZOZNAWCA_TOTAL_PRICE.to] ?? ''}
                  onChange={(e) => setField(RZECZOZNAWCA_TOTAL_PRICE.to, e.target.value)}
                  placeholder="do"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
      </fieldset>

      {!readOnly ? (
        <div className="dash-rzecz-wycena__actions">
          <button type="button" className="dash__btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Zapisywanie…' : 'Zapisz wycenę rzeczoznawcy'}
          </button>
        </div>
      ) : null}

      <p className="dash-muted dash-rzecz-wycena__embed-hint">
        Pełny kalkulator (bez kodów) —{' '}
        <a href={kalkulatorEmbedSrc} target="_blank" rel="noopener noreferrer">
          otwórz w nowej karcie
        </a>
        .
      </p>
    </div>
  )
}
