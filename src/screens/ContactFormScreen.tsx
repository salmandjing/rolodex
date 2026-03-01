import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from 'nanoid'
import { db, createEmptyContact, type Contact } from '../lib/db'
import { Header } from '../components/Header'
import type { Theme } from '../lib/theme'
import styles from './ContactFormScreen.module.css'

interface ContactFormScreenProps {
  theme: Theme
  onToggleTheme: () => void
}

export function ContactFormScreen({ theme, onToggleTheme }: ContactFormScreenProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id

  const existingContact = useLiveQuery(
    () => (!isNew && id ? db.contacts.get(id) : undefined),
    [id, isNew]
  )

  const [formLoaded, setFormLoaded] = useState(false)
  const [form, setForm] = useState(createEmptyContact())

  // Load existing contact data once
  if (!isNew && existingContact && !formLoaded) {
    setForm({
      firstName: existingContact.firstName,
      lastName: existingContact.lastName,
      company: existingContact.company,
      title: existingContact.title,
      phone: existingContact.phone,
      email: existingContact.email,
      city: existingContact.city,
      state: existingContact.state,
      notes: [...existingContact.notes],
      favorite: existingContact.favorite,
    })
    setFormLoaded(true)
  }

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.firstName.trim()) return

    const now = Date.now()

    if (isNew) {
      const contact: Contact = {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        id: nanoid(),
        createdAt: now,
        updatedAt: now,
      }
      await db.contacts.add(contact)
      navigate(`/contact/${contact.id}`, { replace: true })
    } else if (id) {
      await db.contacts.update(id, {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        updatedAt: now,
      })
      navigate(`/contact/${id}`, { replace: true })
    }
  }

  if (!isNew && !existingContact) {
    return (
      <div className={styles.page}>
        <Header
          title={isNew ? 'New Contact' : 'Edit Contact'}
          showBack
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Header
        title={isNew ? 'New Contact' : 'Edit Contact'}
        showBack
        theme={theme}
        onToggleTheme={onToggleTheme}
        actions={
          <button
            className={styles.saveHeaderBtn}
            onClick={handleSave}
            disabled={!form.firstName.trim()}
          >
            {isNew ? 'Add' : 'Save'}
          </button>
        }
      />
      <div className={styles.body}>
        <div className={styles.form}>
          {/* Name Section */}
          <div className={styles.card}>
            <div className={styles.field}>
              <input
                className={styles.input}
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="First name"
                autoFocus={isNew}
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.field}>
              <input
                className={styles.input}
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Work */}
          <div className={styles.card}>
            <div className={styles.field}>
              <input
                className={styles.input}
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Company"
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.field}>
              <input
                className={styles.input}
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Title"
              />
            </div>
          </div>

          {/* Contact */}
          <div className={styles.card}>
            <div className={styles.field}>
              <input
                className={styles.input}
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Phone"
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.field}>
              <input
                className={styles.input}
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>

          {/* Location */}
          <div className={styles.card}>
            <div className={styles.field}>
              <input
                className={styles.input}
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className={styles.divider} />
            <div className={styles.field}>
              <input
                className={styles.input}
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                placeholder="State"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
