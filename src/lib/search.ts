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
    { name: 'notes.text', weight: 0.5 },
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
    company?: string
    location?: string
  }
): Contact[] {
  let filtered = contacts

  if (filters.company) {
    filtered = filtered.filter(
      (c) => c.company.toLowerCase() === filters.company!.toLowerCase()
    )
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase()
    filtered = filtered.filter(
      (c) =>
        c.city.toLowerCase() === loc ||
        c.state.toLowerCase() === loc ||
        `${c.city}, ${c.state}`.toLowerCase() === loc
    )
  }

  return filtered
}

export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    if (a.favorite !== b.favorite) return b.favorite - a.favorite
    return a.firstName.localeCompare(b.firstName)
  })
}
