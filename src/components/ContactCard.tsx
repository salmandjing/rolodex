import { Link } from 'react-router-dom'
import type { Contact } from '../lib/db'
import styles from './ContactCard.module.css'

interface ContactCardProps {
  contact: Contact
}

function getInitials(contact: Contact): string {
  const first = contact.firstName?.[0] || ''
  const last = contact.lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
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
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1mo ago'
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function ContactCard({ contact }: ContactCardProps) {
  const latestNote = contact.notes.length > 0
    ? contact.notes.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
    : null

  return (
    <Link to={`/contact/${contact.id}`} className={styles.card}>
      <div className={styles.avatar}>{getInitials(contact)}</div>
      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.name}>
            {contact.firstName} {contact.lastName}
          </span>
          {latestNote && (
            <span className={styles.time}>{timeAgo(latestNote.createdAt)}</span>
          )}
        </div>
        {contact.company && (
          <div className={styles.company}>{contact.company}{contact.title ? ` \u00B7 ${contact.title}` : ''}</div>
        )}
        {!contact.company && contact.title && (
          <div className={styles.company}>{contact.title}</div>
        )}
        {latestNote && (
          <div className={styles.notePreview}>{latestNote.text}</div>
        )}
      </div>
    </Link>
  )
}
