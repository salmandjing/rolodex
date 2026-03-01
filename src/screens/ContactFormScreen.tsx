import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, X } from 'lucide-react'
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
  const [openSections, setOpenSections] = useState({
    contact: false,
    location: false,
    social: false,
    relationship: false,
  })

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
      country: existingContact.country,
      linkedin: existingContact.linkedin,
      twitter: existingContact.twitter,
      website: existingContact.website,
      tags: [...existingContact.tags],
      howWeMet: existingContact.howWeMet,
      notes: existingContact.notes,
      favorite: existingContact.favorite,
      lastContacted: existingContact.lastContacted,
      relationshipStrength: existingContact.relationshipStrength,
    })
    setOpenSections({
      contact: !!(existingContact.phone || existingContact.email),
      location: !!(existingContact.city || existingContact.state),
      social: !!(existingContact.linkedin || existingContact.twitter || existingContact.website),
      relationship: !!(existingContact.howWeMet || existingContact.notes || existingContact.tags.length),
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

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
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

  // Wait for existing contact to load
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
      />
      <div className={styles.body}>
        <div className={styles.form}>
          {/* Basic Info — always open */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Basic Info</div>
            <div className={styles.sectionBody}>
              <div className={styles.field}>
                <label className={styles.label}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  className={styles.input}
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="First name"
                  autoFocus={isNew}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Last Name</label>
                <input
                  className={styles.input}
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Company</label>
                <input
                  className={styles.input}
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Company"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Job title"
                />
              </div>
            </div>
          </div>

          {/* Contact — collapsible */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('contact')}>
              <span className={styles.sectionTitle}>Contact Info</span>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${openSections.contact ? styles.chevronOpen : ''}`}
              />
            </div>
            {openSections.contact && (
              <div className={styles.sectionBody}>
                <div className={styles.field}>
                  <label className={styles.label}>Phone</label>
                  <input
                    className={styles.input}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="name@company.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location — collapsible */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('location')}>
              <span className={styles.sectionTitle}>Location</span>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${openSections.location ? styles.chevronOpen : ''}`}
              />
            </div>
            {openSections.location && (
              <div className={styles.sectionBody}>
                <div className={styles.field}>
                  <label className={styles.label}>City</label>
                  <input
                    className={styles.input}
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>State</label>
                  <input
                    className={styles.input}
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Social — collapsible */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('social')}>
              <span className={styles.sectionTitle}>Social</span>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${openSections.social ? styles.chevronOpen : ''}`}
              />
            </div>
            {openSections.social && (
              <div className={styles.sectionBody}>
                <div className={styles.field}>
                  <label className={styles.label}>LinkedIn</label>
                  <input
                    className={styles.input}
                    value={form.linkedin}
                    onChange={(e) => updateField('linkedin', e.target.value)}
                    placeholder="linkedin.com/in/handle or handle"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Twitter / X</label>
                  <input
                    className={styles.input}
                    value={form.twitter}
                    onChange={(e) => updateField('twitter', e.target.value)}
                    placeholder="@handle"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Website</label>
                  <input
                    className={styles.input}
                    type="url"
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Relationship — collapsible */}
          <div className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => toggleSection('relationship')}>
              <span className={styles.sectionTitle}>Relationship</span>
              <ChevronDown
                size={16}
                className={`${styles.chevron} ${openSections.relationship ? styles.chevronOpen : ''}`}
              />
            </div>
            {openSections.relationship && (
              <div className={styles.sectionBody}>
                {/* Tags */}
                <div className={styles.field}>
                  <label className={styles.label}>Tags</label>
                  <div className={styles.tagInput}>
                    {form.tags.map((tag) => (
                      <span key={tag} className={styles.tagChip}>
                        {tag}
                        <button
                          className={styles.tagChipRemove}
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
                  {suggestedTags.length > 0 && (
                    <div className={styles.tagSuggestions}>
                      {suggestedTags.slice(0, 8).map((tag) => (
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

                <div className={styles.field}>
                  <label className={styles.label}>How we met</label>
                  <input
                    className={styles.input}
                    value={form.howWeMet}
                    onChange={(e) => updateField('howWeMet', e.target.value)}
                    placeholder="Conference, intro from..., etc."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Relationship strength</label>
                  <div className={styles.strengthPicker}>
                    {([1, 2, 3, 4, 5] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`${styles.strengthDot} ${
                          n <= form.relationshipStrength ? styles.strengthDotActive : ''
                        }`}
                        onClick={() => updateField('relationshipStrength', n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Notes</label>
                  <textarea
                    className={`${styles.input} ${styles.textarea}`}
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Anything worth remembering..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.cancelBtn}
              onClick={() => navigate(-1)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!form.firstName.trim()}
              type="button"
            >
              {isNew ? 'Add Contact' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
