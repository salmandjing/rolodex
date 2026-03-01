import { Users } from 'lucide-react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title?: string
  subtitle?: string
}

export function EmptyState({
  title = 'No contacts yet',
  subtitle = 'Tap + to add your first contact.',
}: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrap}>
        <Users size={32} className={styles.icon} />
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
    </div>
  )
}
