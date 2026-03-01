import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Phone,
  Mail,
  MapPin,
  Linkedin,
  Twitter,
  Globe,
  Building2,
  Briefcase,
  Star,
  Edit3,
  Trash2,
  MessageCircle,
  CalendarCheck,
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
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

export function ContactDetailScreen({ theme, onToggleTheme }: ContactDetailScreenProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showDelete, setShowDelete] = useState(false)

  const contact = useLiveQuery(() => (id ? db.contacts.get(id) : undefined), [id])

  if (!contact) {
    return (
      <div className={styles.page}>
        <Header title="Contact" showBack theme={theme} onToggleTheme={onToggleTheme} />
        <div className={styles.body} style={{ textAlign: 'center', paddingTop: 48, color: 'var(--text-secondary)' }}>
          Contact not found.
        </div>
      </div>
    )
  }

  const initials =
    ((contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')).toUpperCase() || '?'

  const metaParts: string[] = []
  if (contact.title) metaParts.push(contact.title)
  if (contact.company) metaParts.push(contact.company)

  const handleDelete = async () => {
    await db.contacts.delete(contact.id)
    navigate('/', { replace: true })
  }

  const handleMarkContacted = async () => {
    await db.contacts.update(contact.id, {
      lastContacted: Date.now(),
      updatedAt: Date.now(),
    })
  }

  const handleToggleFavorite = async () => {
    await db.contacts.update(contact.id, {
      favorite: contact.favorite === 1 ? 0 : 1,
      updatedAt: Date.now(),
    })
  }

  const locationParts: string[] = []
  if (contact.city) locationParts.push(contact.city)
  if (contact.state) locationParts.push(contact.state)

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
              style={{ display: 'flex', alignItems: 'center', padding: 8 }}
              aria-label={contact.favorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star
                size={18}
                color="var(--favorite)"
                fill={contact.favorite === 1 ? 'var(--favorite)' : 'none'}
              />
            </button>
            <Link
              to={`/contact/${contact.id}/edit`}
              style={{ display: 'flex', alignItems: 'center', padding: 8, color: 'var(--text-secondary)' }}
              aria-label="Edit contact"
            >
              <Edit3 size={18} />
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
          {metaParts.length > 0 && (
            <div className={styles.heroMeta}>{metaParts.join(' · ')}</div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {contact.phone && (
            <a href={`tel:${contact.phone}`} className={styles.quickBtn}>
              <Phone size={18} className={styles.quickBtnIcon} />
              <span className={styles.quickBtnLabel}>Call</span>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className={styles.quickBtn}>
              <Mail size={18} className={styles.quickBtnIcon} />
              <span className={styles.quickBtnLabel}>Email</span>
            </a>
          )}
          <button className={`${styles.quickBtn} ${styles.contactedBtn}`} onClick={handleMarkContacted}>
            <CalendarCheck size={18} className={styles.quickBtnIcon} />
            <span className={styles.quickBtnLabel}>Contacted</span>
          </button>
        </div>

        {contact.lastContacted && (
          <div className={styles.lastContacted}>
            Last contacted: {timeAgo(contact.lastContacted)}
          </div>
        )}

        {/* Contact Info */}
        {(contact.phone || contact.email) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Contact</div>
            <div className={styles.card}>
              {contact.phone && (
                <div className={styles.row}>
                  <Phone size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <div className={styles.rowLabel}>Phone</div>
                    <a href={`tel:${contact.phone}`} className={`${styles.rowValue} ${styles.rowValueLink}`}>
                      {contact.phone}
                    </a>
                  </div>
                </div>
              )}
              {contact.email && (
                <div className={styles.row}>
                  <Mail size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <div className={styles.rowLabel}>Email</div>
                    <a href={`mailto:${contact.email}`} className={`${styles.rowValue} ${styles.rowValueLink}`}>
                      {contact.email}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Work */}
        {(contact.company || contact.title) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Work</div>
            <div className={styles.card}>
              {contact.company && (
                <div className={styles.row}>
                  <Building2 size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <div className={styles.rowLabel}>Company</div>
                    <div className={styles.rowValue}>{contact.company}</div>
                  </div>
                </div>
              )}
              {contact.title && (
                <div className={styles.row}>
                  <Briefcase size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <div className={styles.rowLabel}>Title</div>
                    <div className={styles.rowValue}>{contact.title}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location */}
        {locationParts.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Location</div>
            <div className={styles.card}>
              <div className={styles.row}>
                <MapPin size={16} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowValue}>{locationParts.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social */}
        {(contact.linkedin || contact.twitter || contact.website) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Social</div>
            <div className={styles.card}>
              {contact.linkedin && (
                <div className={styles.row}>
                  <Linkedin size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <a
                      href={contact.linkedin.startsWith('http') ? contact.linkedin : `https://linkedin.com/in/${contact.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.rowValue} ${styles.rowValueLink}`}
                    >
                      {contact.linkedin}
                    </a>
                  </div>
                </div>
              )}
              {contact.twitter && (
                <div className={styles.row}>
                  <Twitter size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <a
                      href={contact.twitter.startsWith('http') ? contact.twitter : `https://x.com/${contact.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.rowValue} ${styles.rowValueLink}`}
                    >
                      @{contact.twitter.replace('@', '')}
                    </a>
                  </div>
                </div>
              )}
              {contact.website && (
                <div className={styles.row}>
                  <Globe size={16} className={styles.rowIcon} />
                  <div className={styles.rowContent}>
                    <a
                      href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${styles.rowValue} ${styles.rowValueLink}`}
                    >
                      {contact.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Tags</div>
            <div className={styles.card}>
              <div className={styles.tags}>
                {contact.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Relationship */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Relationship</div>
          <div className={styles.card}>
            {contact.howWeMet && (
              <div className={styles.row}>
                <MessageCircle size={16} className={styles.rowIcon} />
                <div className={styles.rowContent}>
                  <div className={styles.rowLabel}>How we met</div>
                  <div className={styles.rowValue}>{contact.howWeMet}</div>
                </div>
              </div>
            )}
            <div className={styles.row}>
              <Star size={16} className={styles.rowIcon} />
              <div className={styles.rowContent}>
                <div className={styles.rowLabel}>Relationship strength</div>
                <div className={styles.strength}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className={`${styles.dot} ${n <= contact.relationshipStrength ? styles.dotFilled : ''}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {contact.notes && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Notes</div>
            <div className={styles.card}>
              <div className={styles.notes}>{contact.notes}</div>
            </div>
          </div>
        )}

        {/* Delete */}
        <div className={styles.dangerSection}>
          <button className={styles.deleteBtn} onClick={() => setShowDelete(true)}>
            <Trash2 size={14} />
            Delete Contact
          </button>
        </div>
      </div>

      {showDelete && (
        <ConfirmDialog
          title="Delete contact"
          message={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  )
}
