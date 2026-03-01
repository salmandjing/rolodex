import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { nanoid } from 'nanoid'
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Briefcase,
  Star,
  Edit3,
  Trash2,
  Send,
} from 'lucide-react'
import { db } from '../lib/db'
import { Header } from '../components/Header'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Theme } from '../lib/theme'
import styles from './ContactDetailScreen.module.css'

interface ContactDetailScreenProps {
  theme: Theme
  onToggleTheme: () => void
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? 's' : ''} ago`
}

export function ContactDetailScreen({ theme, onToggleTheme }: ContactDetailScreenProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)
  const [noteInput, setNoteInput] = useState('')

  const contact = useLiveQuery(() => (id ? db.contacts.get(id) : undefined), [id])

  if (!contact) {
    return (
      <div className={styles.page}>
        <Header title="Contact" showBack theme={theme} onToggleTheme={onToggleTheme} />
        <div className={styles.notFound}>Contact not found.</div>
      </div>
    )
  }

  const initials =
    ((contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')).toUpperCase() || '?'

  const handleDelete = async () => {
    await db.contacts.delete(contact.id)
    navigate('/', { replace: true })
  }

  const handleToggleFavorite = async () => {
    await db.contacts.update(contact.id, {
      favorite: contact.favorite === 1 ? 0 : 1,
      updatedAt: Date.now(),
    })
  }

  const handleAddNote = async () => {
    const text = noteInput.trim()
    if (!text) return

    const newNote = { id: nanoid(), text, createdAt: Date.now() }
    await db.contacts.update(contact.id, {
      notes: [newNote, ...contact.notes],
      updatedAt: Date.now(),
    })
    setNoteInput('')
  }

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddNote()
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    // eslint-disable-next-line react-hooks/purity
    const ts = Date.now()
    await db.contacts.update(contact.id, {
      notes: contact.notes.filter((n) => n.id !== noteId),
      updatedAt: ts,
    })
  }

  const locationParts: string[] = []
  if (contact.city) locationParts.push(contact.city)
  if (contact.state) locationParts.push(contact.state)

  const sortedNotes = [...contact.notes].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className={styles.page}>
      <Header
        title=""
        showBack
        theme={theme}
        onToggleTheme={onToggleTheme}
        actions={
          <>
            <button
              onClick={handleToggleFavorite}
              className={styles.headerBtn}
              aria-label={contact.favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star
                size={20}
                color="var(--favorite)"
                fill={contact.favorite === 1 ? 'var(--favorite)' : 'none'}
              />
            </button>
            <Link
              to={`/contact/${contact.id}/edit`}
              className={styles.headerBtn}
              aria-label="Edit contact"
            >
              <Edit3 size={20} color="var(--accent)" />
            </Link>
          </>
        }
      />
      <div className={styles.body}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.heroName}>
            {contact.firstName} {contact.lastName}
          </div>
          {(contact.title || contact.company) && (
            <div className={styles.heroMeta}>
              {[contact.title, contact.company].filter(Boolean).join(' at ')}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={styles.quickBtn}>
              <Phone size={20} />
              <span>Call</span>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className={styles.quickBtn}>
              <Mail size={20} />
              <span>Email</span>
            </a>
          )}
        </div>

        {/* Notes — the killer feature */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Notes</div>

          <div className={styles.noteInputWrap}>
            <input
              className={styles.noteInput}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={handleNoteKeyDown}
              placeholder="Add a quick note..."
            />
            {noteInput.trim() && (
              <button className={styles.noteSubmit} onClick={handleAddNote}>
                <Send size={16} />
              </button>
            )}
          </div>

          {sortedNotes.length > 0 ? (
            <div className={styles.notesList}>
              {sortedNotes.map((note) => (
                <div key={note.id} className={styles.noteItem}>
                  <div className={styles.noteBullet} />
                  <div className={styles.noteContent}>
                    <div className={styles.noteText}>{note.text}</div>
                    <div className={styles.noteTime}>{timeAgo(note.createdAt)}</div>
                  </div>
                  <button
                    className={styles.noteDelete}
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label="Delete note"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyNotes}>
              No notes yet. Add one above.
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Info</div>
          <div className={styles.card}>
            {contact.company && (
              <div className={styles.row}>
                <Building2 size={17} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowLabel}>Company</div>
                  <div className={styles.rowValue}>{contact.company}</div>
                </div>
              </div>
            )}
            {contact.title && (
              <div className={styles.row}>
                <Briefcase size={17} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowLabel}>Title</div>
                  <div className={styles.rowValue}>{contact.title}</div>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className={styles.row}>
                <Phone size={17} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowLabel}>Phone</div>
                  <a href={`tel:${contact.phone}`} className={styles.rowLink}>
                    {contact.phone}
                  </a>
                </div>
              </div>
            )}
            {contact.email && (
              <div className={styles.row}>
                <Mail size={17} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowLabel}>Email</div>
                  <a href={`mailto:${contact.email}`} className={styles.rowLink}>
                    {contact.email}
                  </a>
                </div>
              </div>
            )}
            {locationParts.length > 0 && (
              <div className={styles.row}>
                <MapPin size={17} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowLabel}>Location</div>
                  <div className={styles.rowValue}>{locationParts.join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Tags</div>
            <div className={styles.tags}>
              {contact.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        <div className={styles.dangerSection}>
          <button className={styles.deleteBtn} onClick={() => setShowDelete(true)}>
            Delete Contact
          </button>
        </div>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete contact?"
          message={`${contact.firstName} ${contact.lastName} will be permanently deleted.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
