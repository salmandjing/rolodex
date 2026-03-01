import { Star, Tag, Building2, MapPin } from 'lucide-react'
import styles from './FilterChips.module.css'

export interface Filters {
  favoritesOnly: boolean
  tag: string
  company: string
  state: string
}

interface FilterChipsProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  availableTags: string[]
  availableCompanies: string[]
  availableStates: string[]
}

export function FilterChips({
  filters,
  onFilterChange,
  availableTags,
  availableCompanies,
  availableStates,
}: FilterChipsProps) {
  const toggleFavorites = () =>
    onFilterChange({ ...filters, favoritesOnly: !filters.favoritesOnly })

  const toggleTag = (tag: string) =>
    onFilterChange({ ...filters, tag: filters.tag === tag ? '' : tag })

  const toggleCompany = (company: string) =>
    onFilterChange({ ...filters, company: filters.company === company ? '' : company })

  const toggleState = (state: string) =>
    onFilterChange({ ...filters, state: filters.state === state ? '' : state })

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.chip} ${filters.favoritesOnly ? styles.chipActive : ''}`}
        onClick={toggleFavorites}
      >
        <span className={styles.chipIcon}><Star size={12} /></span>
        Favorites
      </button>

      {availableTags.map((tag) => (
        <button
          key={tag}
          className={`${styles.chip} ${filters.tag === tag ? styles.chipActive : ''}`}
          onClick={() => toggleTag(tag)}
        >
          <span className={styles.chipIcon}><Tag size={12} /></span>
          {tag}
        </button>
      ))}

      {availableCompanies.map((company) => (
        <button
          key={company}
          className={`${styles.chip} ${filters.company === company ? styles.chipActive : ''}`}
          onClick={() => toggleCompany(company)}
        >
          <span className={styles.chipIcon}><Building2 size={12} /></span>
          {company}
        </button>
      ))}

      {availableStates.map((state) => (
        <button
          key={state}
          className={`${styles.chip} ${filters.state === state ? styles.chipActive : ''}`}
          onClick={() => toggleState(state)}
        >
          <span className={styles.chipIcon}><MapPin size={12} /></span>
          {state}
        </button>
      ))}
    </div>
  )
}
