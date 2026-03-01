import Dexie, { type EntityTable } from 'dexie'

export interface Note {
  id: string
  text: string
  createdAt: number
}

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
  notes: Note[]
  favorite: number // 0 or 1 — indexed booleans need to be numbers in IndexedDB
  createdAt: number
  updatedAt: number
}

export const db = new Dexie('RolodexDB') as Dexie & {
  contacts: EntityTable<Contact, 'id'>
}

db.version(2).stores({
  contacts:
    'id, firstName, lastName, company, city, state, favorite, updatedAt',
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
    notes: [],
    favorite: 0,
  }
}
