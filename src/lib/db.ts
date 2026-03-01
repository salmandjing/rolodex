import Dexie, { type EntityTable } from 'dexie'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  company: string
  title: string
  phone: string
  email: string
  city: string
  state: string
  country: string
  linkedin: string
  twitter: string
  website: string
  tags: string[]
  howWeMet: string
  notes: string
  favorite: number // 0 or 1 — indexed booleans need to be numbers in IndexedDB
  lastContacted: number | null
  relationshipStrength: 1 | 2 | 3 | 4 | 5
  createdAt: number
  updatedAt: number
}

export const db = new Dexie('RolodexDB') as Dexie & {
  contacts: EntityTable<Contact, 'id'>
}

db.version(1).stores({
  contacts:
    'id, firstName, lastName, company, state, *tags, favorite, updatedAt, lastContacted',
})

export function createEmptyContact(): Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    firstName: '',
    lastName: '',
    company: '',
    title: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    country: 'US',
    linkedin: '',
    twitter: '',
    website: '',
    tags: [],
    howWeMet: '',
    notes: '',
    favorite: 0,
    lastContacted: null,
    relationshipStrength: 3,
  }
}
