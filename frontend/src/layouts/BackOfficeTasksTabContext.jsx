import { createContext, useContext } from 'react'

/** Zakładki zadań w nagłówku back office: kolejka BO, „moje” (wkrótce z przypisaniami), zakończone → archiwum. */
export const BackOfficeTasksTabContext = createContext(null)

export function useBackOfficeTasksTab() {
  return useContext(BackOfficeTasksTabContext)
}
