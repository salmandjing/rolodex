import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
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

function getMeta(contact: Contact): string {
  const parts: string[] = []
  if (contact.title) parts.push(contact.title)
  if (contact.company) parts.push(contact.company)
  if (!parts.length && contact.city) parts.push(contact.city)
  return parts.join(' · ')
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <Link to={`/contact/${contact.id}`} className={styles.card}>
      <div className={styles.avatar}>{getInitials(contact)}</div>
      <div className={styles.info}>
        <div className={styles.name}>
          {contact.firstName} {contact.lastName}
        </div>
        {getMeta(contact) && <div className={styles.meta}>{getMeta(contact)}</div>}
      </div>
      <div className={styles.right}>
        {contact.favorite === 1 && (
          <Star size={14} className={styles.star} fill="var(--favorite)" />
        )}
        {contact.tags.length > 0 && (
          <div className={styles.tags}>
            {contact.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
