import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { searchContacts, filterContacts, sortContacts } from '../lib/search'
import { Header } from '../components/Header'
import { SearchBar } from '../components/SearchBar'
import { FilterChips, type Filters } from '../components/FilterChips'
import { ContactCard } from '../components/ContactCard'
import { FAB } from '../components/FAB'
import { EmptyState } from '../components/EmptyState'
import type { Theme } from '../lib/theme'
import styles from './HomeScreen.module.css'

interface HomeScreenProps {
  theme: Theme
  onToggleTheme: () => void
}

const defaultFilters: Filters = {
  favoritesOnly: false,
  tag: '',
  company: '',
  state: '',
}

export function HomeScreen({ theme, onToggleTheme }: HomeScreenProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Filters>(defaultFilters)

  const allContacts = useLiveQuery(() => db.contacts.toArray(), [])

  const { availableTags, availableCompanies, availableStates } = useMemo(() => {
    if (!allContacts) return { availableTags: [], availableCompanies: [], availableStates: [] }

    const tagCounts = new Map<string, number>()
    const companyCounts = new Map<string, number>()
    const stateCounts = new Map<string, number>()

    for (const c of allContacts) {
      for (const t of c.tags) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1)
      }
      if (c.company) {
        companyCounts.set(c.company, (companyCounts.get(c.company) || 0) + 1)
      }
      if (c.state) {
        stateCounts.set(c.state, (stateCounts.get(c.state) || 0) + 1)
      }
    }

    return {
      availableTags: [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag),
      availableCompanies: [...companyCounts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([company]) => company),
      availableStates: [...stateCounts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .map(([state]) => state),
    }
  }, [allContacts])

  const displayedContacts = useMemo(() => {
    if (!allContacts) return []

    let result = allContacts

    // Apply filters first
    result = filterContacts(result, filters)

    // Apply search
    if (query.trim()) {
      result = searchContacts(result, query)
    } else {
      result = sortContacts(result)
    }

    return result
  }, [allContacts, query, filters])

  // Group by first letter for alpha headers (only when not searching)
  const grouped = useMemo(() => {
    if (query.trim()) return null

    const groups = new Map<string, typeof displayedContacts>()
    for (const c of displayedContacts) {
      // Favorites group first
      if (c.favorite === 1) {
        const key = '★'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(c)
        continue
      }
      const letter = (c.firstName[0] || '#').toUpperCase()
      if (!groups.has(letter)) groups.set(letter, [])
      groups.get(letter)!.push(c)
    }
    return groups
  }, [displayedContacts, query])

  if (!allContacts) return null

  return (
    <div className={styles.page}>
      <Header title="Rolodex" theme={theme} onToggleTheme={onToggleTheme} />
      <div className={styles.body}>
        <SearchBar value={query} onChange={setQuery} />
        <FilterChips
          filters={filters}
          onFilterChange={setFilters}
          availableTags={availableTags}
          availableCompanies={availableCompanies}
          availableStates={availableStates}
        />
        <div className={styles.count}>
          {displayedContacts.length} contact{displayedContacts.length !== 1 ? 's' : ''}
        </div>
        {displayedContacts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={styles.list}>
            {grouped
              ? [...grouped.entries()].map(([letter, contacts]) => (
                  <div key={letter}>
                    <div className={styles.alpha}>{letter}</div>
                    {contacts.map((c) => (
                      <ContactCard key={c.id} contact={c} />
                    ))}
                  </div>
                ))
              : displayedContacts.map((c) => (
                  <ContactCard key={c.id} contact={c} />
                ))}
          </div>
        )}
      </div>
      <FAB />
    </div>
  )
}
