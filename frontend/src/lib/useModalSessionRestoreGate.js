import { useCallback, useEffect, useRef } from 'react'
import { pickLeadRowFromModalSession } from './firstLeadModalSession'

/**
 * Przywrócenie podglądu umowy z sessionStorage tylko raz na daną ścieżkę (pathname).
 * Kolejne wywołania `load()` (np. po zapisie w modalu) nie ustawiają ponownie `selected`,
 * więc zamknięcie modala X / tło nie „wraca” w pętli. Po F5 lub zmianie URL bramka się zeruje.
 *
 * @param {string} scope — zwykle `location.pathname`
 */
export function useModalSessionRestoreGate(scope) {
  const consumedRef = useRef(false)
  useEffect(() => {
    consumedRef.current = false
  }, [scope])
  return useCallback(
    (rows) => {
      if (consumedRef.current) return null
      consumedRef.current = true
      return pickLeadRowFromModalSession(scope, rows)
    },
    [scope],
  )
}
