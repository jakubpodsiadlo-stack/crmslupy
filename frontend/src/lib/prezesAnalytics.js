import {
  getAgentDisplay,
  getBackofficeStatusLabel,
  getCodeTimestamp,
  getRzeczoznawcaStatusValue,
  getVerificationLabel,
} from './firstLeadDisplay'
import { RZECZOZNAWCA_TOTAL_PRICE } from './rzeczoznawcaFields'

/** Parsuje liczby z pól wyceny (przecinek/kropka, spacje). */
export function parsePriceField(val) {
  if (val == null) return null
  const s = String(val).trim().replace(/\s/g, '').replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function monthKeyFromIso(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Agregaty pod panel prezesa (wykresy, KPI, koszty).
 * @param {object[]} rows — wiersze first_lead (jak z fetchAllLeadsMerged)
 */
export function buildPrezesAggregates(rows) {
  const list = Array.isArray(rows) ? rows : []
  const total = list.length
  let archived = 0
  let infoliniaOk = 0
  let boOk = 0
  let kancelaria = 0
  const rzeczForBo = {
    dostarczono: 0,
    'w trakcie weryfikacji': 0,
    'przekazano do kancelarii': 0,
  }
  const byMonth = new Map()
  const byAgent = new Map()
  let sumTotalMid = 0
  let countWithEstimate = 0
  let boQueue = 0

  for (const r of list) {
    if (r.archived_at) archived += 1
    if (getVerificationLabel(r) === 'zweryfikowany') infoliniaOk += 1
    const bo = getBackofficeStatusLabel(r)
    if (bo === 'zweryfikowany') {
      boOk += 1
      const st = getRzeczoznawcaStatusValue(r)
      if (st in rzeczForBo) rzeczForBo[st] += 1
      if (st === 'przekazano do kancelarii') kancelaria += 1
    } else {
      boQueue += 1
    }

    const mk = monthKeyFromIso(getCodeTimestamp(r))
    if (mk) byMonth.set(mk, (byMonth.get(mk) || 0) + 1)

    const agent = getAgentDisplay(r)?.trim()
    if (agent) byAgent.set(agent, (byAgent.get(agent) || 0) + 1)

    const f = r.rzeczoznawca_fields
    if (f && typeof f === 'object') {
      const to = parsePriceField(f[RZECZOZNAWCA_TOTAL_PRICE.to])
      const from = parsePriceField(f[RZECZOZNAWCA_TOTAL_PRICE.from])
      const mid = to != null ? to : from
      if (mid != null && mid >= 0) {
        sumTotalMid += mid
        countWithEstimate += 1
      }
    }
  }

  const monthKeys = [...byMonth.keys()].sort()
  const last12 = monthKeys.slice(-12)
  const byMonthChart = last12.map((k) => ({ name: k, umowy: byMonth.get(k) || 0 }))

  const agentEntries = [...byAgent.entries()].sort((a, b) => b[1] - a[1])
  const topAgents = agentEntries.slice(0, 12).map(([name, value]) => ({ name, umowy: value }))

  return {
    total,
    archived,
    activeInfolinia: total - archived,
    infoliniaOk,
    infoliniaPending: total - infoliniaOk,
    boOk,
    boQueue,
    kancelaria,
    rzeczForBo,
    byMonthChart,
    topAgents,
    sumTotalMid,
    countWithEstimate,
    avgEstimate: countWithEstimate > 0 ? sumTotalMid / countWithEstimate : null,
  }
}

export function pieDataInfolinia(agg) {
  return [
    { name: 'Zweryfikowane', value: agg.infoliniaOk },
    { name: 'Oczekujące', value: Math.max(0, agg.infoliniaPending) },
  ].filter((x) => x.value > 0)
}

export function pieDataBo(agg) {
  return [
    { name: 'BO gotowe', value: agg.boOk },
    { name: 'BO w toku', value: Math.max(0, agg.boQueue) },
  ].filter((x) => x.value > 0)
}

export function pieDataRzecz(agg) {
  const r = agg.rzeczForBo
  return [
    { name: 'Dostarczono', value: r['dostarczono'] },
    { name: 'W trakcie', value: r['w trakcie weryfikacji'] },
    { name: 'Do kancelarii', value: r['przekazano do kancelarii'] },
  ].filter((x) => x.value > 0)
}
