import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { X } from 'lucide-react'
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
  const isNew = id === 'new'

  const existingContact = useLiveQuery(
    () => (!isNew && id ? db.contacts.get(id) : undefined),
    [id, isNew]
  )

  const allContacts = useLiveQuery(() => db.contacts.toArray(), [])
  const existingTags = useMemo(() => {
    if (!allContacts) return []
    const tagSet = new Set<string>()
    for (const c of allContacts) {
      for (const t of c.tags) tagSet.add(t)
    }
    return [...tagSet].sort()
  }, [allContacts])

  const [formLoaded, setFormLoaded] = useState(false)
  const [form, setForm] = useState(createEmptyContact())
  const [tagInput, setTagInput] = useState('')

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
      tags: [...existingContact.tags],
      notes: [...existingContact.notes],
      favorite: existingContact.favorite,
    })
    setFormLoaded(true)
  }

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !form.tags.includes(trimmed)) {
      updateField('tags', [...form.tags, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    updateField('tags', form.tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      removeTag(form.tags[form.tags.length - 1])
    }
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

  const suggestedTags = existingTags.filter(
    (t) => !form.tags.includes(t) && (!tagInput || t.includes(tagInput.toLowerCase()))
  )

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

          {/* Tags */}
          <div className={styles.sectionLabel}>Tags</div>
          <div className={styles.card}>
            <div className={styles.tagInputWrap}>
              {form.tags.map((tag) => (
                <span key={tag} className={styles.tagChip}>
                  {tag}
                  <button
                    className={styles.tagRemove}
                    onClick={() => removeTag(tag)}
                    type="button"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                className={styles.tagTextInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={form.tags.length ? '' : 'Add tags...'}
              />
            </div>
          </div>
          {suggestedTags.length > 0 && (
            <div className={styles.tagSuggestions}>
              {suggestedTags.slice(0, 6).map((tag) => (
                <button
                  key={tag}
                  className={styles.tagSuggestion}
                  onClick={() => addTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
