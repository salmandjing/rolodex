import Fuse, { type IFuseOptions } from 'fuse.js'
import type { Contact } from './db'

const fuseOptions: IFuseOptions<Contact> = {
  keys: [
    { name: 'firstName', weight: 3 },
    { name: 'lastName', weight: 3 },
    { name: 'company', weight: 2 },
    { name: 'title', weight: 1.5 },
    { name: 'tags', weight: 1.5 },
    { name: 'city', weight: 1 },
    { name: 'state', weight: 1 },
    { name: 'email', weight: 1 },
    { name: 'notes', weight: 0.5 },
    { name: 'howWeMet', weight: 0.5 },
  ],
  threshold: 0.35,
  includeScore: true,
}

export function searchContacts(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) return contacts
  const fuse = new Fuse(contacts, fuseOptions)
  return fuse.search(query).map((result) => result.item)
}

export function filterContacts(
  contacts: Contact[],
  filters: {
    tag?: string
    company?: string
    state?: string
    favoritesOnly?: boolean
  }
): Contact[] {
  let filtered = contacts

  if (filters.favoritesOnly) {
    filtered = filtered.filter((c) => c.favorite === 1)
  }

  if (filters.tag) {
    const tag = filters.tag.toLowerCase()
    filtered = filtered.filter((c) =>
      c.tags.some((t) => t.toLowerCase() === tag)
    )
  }

  if (filters.company) {
    filtered = filtered.filter(
      (c) => c.company.toLowerCase() === filters.company!.toLowerCase()
    )
  }

  if (filters.state) {
    filtered = filtered.filter(
      (c) => c.state.toLowerCase() === filters.state!.toLowerCase()
    )
  }

  return filtered
}

export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    // Favorites first
    if (a.favorite !== b.favorite) return b.favorite - a.favorite
    // Then alphabetical by first name
    return a.firstName.localeCompare(b.firstName)
  })
}
