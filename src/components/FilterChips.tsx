import { Building2, MapPin } from 'lucide-react'
import styles from './FilterChips.module.css'

export interface Filters {
  company: string
  location: string
}

interface FilterChipsProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  availableCompanies: string[]
  availableLocations: string[]
}

export function FilterChips({
  filters,
  onFilterChange,
  availableCompanies,
  availableLocations,
}: FilterChipsProps) {
  const toggleCompany = (company: string) =>
    onFilterChange({ ...filters, company: filters.company === company ? '' : company })

  const toggleLocation = (location: string) =>
    onFilterChange({ ...filters, location: filters.location === location ? '' : location })

  if (availableCompanies.length === 0 && availableLocations.length === 0) return null

  return (
    <div className={styles.wrapper}>
      {availableLocations.map((loc) => (
        <button
          key={loc}
          className={`${styles.chip} ${filters.location === loc ? styles.chipActive : ''}`}
          onClick={() => toggleLocation(loc)}
        >
          <MapPin size={13} className={styles.chipIcon} />
          {loc}
        </button>
      ))}

      {availableCompanies.map((company) => (
        <button
          key={company}
          className={`${styles.chip} ${filters.company === company ? styles.chipActive : ''}`}
          onClick={() => toggleCompany(company)}
        >
          <Building2 size={13} className={styles.chipIcon} />
          {company}
        </button>
      ))}
    </div>
  )
}
