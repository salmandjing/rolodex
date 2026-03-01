import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { searchContacts, filterContacts, sortContacts } from '../lib/search'
import { SearchBar } from '../components/SearchBar'
import { FilterChips, type Filters } from '../components/FilterChips'
import { ContactCard } from '../components/ContactCard'
import { FAB } from '../components/FAB'
import { EmptyState } from '../components/EmptyState'
import { Settings } from 'lucide-react'
import type { Theme } from '../lib/theme'
import styles from './HomeScreen.module.css'

interface HomeScreenProps {
  theme: Theme
  onToggleTheme: () => void
}

const defaultFilters: Filters = {
  company: '',
  location: '',
}

export function HomeScreen({ theme, onToggleTheme }: HomeScreenProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const allContacts = useLiveQuery(() => db.contacts.toArray(), [])

  const { availableCompanies, availableLocations } = useMemo(() => {
    if (!allContacts) return { availableCompanies: [], availableLocations: [] }

    const companyCounts = new Map<string, number>()
    const locationCounts = new Map<string, number>()

    for (const c of allContacts) {
      if (c.company) {
        companyCounts.set(c.company, (companyCounts.get(c.company) || 0) + 1)
      }
      if (c.state) {
        locationCounts.set(c.state, (locationCounts.get(c.state) || 0) + 1)
      }
    }

    return {
      availableCompanies: [...companyCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([company]) => company),
      availableLocations: [...locationCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([state]) => state),
    }
  }, [allContacts])

  const displayedContacts = useMemo(() => {
    if (!allContacts) return []

    let result = allContacts
    result = filterContacts(result, filters)

    if (query.trim()) {
      result = searchContacts(result, query)
    } else {
      result = sortContacts(result)
    }

    return result
  }, [allContacts, query, filters])

  if (!allContacts) return null

  return (
    <div className={styles.page}>
      <div className={styles.topSection}>
        <div className={styles.titleRow}>
          <h1 className={styles.largeTitle}>Contacts</h1>
          <div className={styles.titleActions}>
            <button
              className={styles.iconBtn}
              onClick={() => navigate('/settings')}
              aria-label="Settings"
            >
              <Settings size={22} />
            </button>
            <button
              className={styles.iconBtn}
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
          </div>
        </div>
        <SearchBar value={query} onChange={setQuery} />
        <FilterChips
          filters={filters}
          onFilterChange={setFilters}
          availableCompanies={availableCompanies}
          availableLocations={availableLocations}
        />
      </div>

      <div className={styles.body}>
        {displayedContacts.length === 0 ? (
          query || filters.company || filters.location ? (
            <EmptyState
              title="No results"
              subtitle="Try a different search or clear your filters."
            />
          ) : (
            <EmptyState />
          )
        ) : (
          <div className={styles.list}>
            <div className={styles.count}>
              {displayedContacts.length} contact{displayedContacts.length !== 1 ? 's' : ''}
            </div>
            {displayedContacts.map((c) => (
              <ContactCard key={c.id} contact={c} />
            ))}
          </div>
        )}
      </div>
      <FAB />
    </div>
  )
}
