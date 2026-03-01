import { UserX } from 'lucide-react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title?: string
  subtitle?: string
}

export function EmptyState({
  title = 'No contacts found',
  subtitle = 'Try adjusting your search or filters, or add a new contact.',
}: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <UserX size={40} className={styles.icon} />
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
    </div>
  )
}
