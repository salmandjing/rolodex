import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Sun, Moon } from 'lucide-react'
import styles from './Header.module.css'
import type { Theme } from '../lib/theme'

interface HeaderProps {
  title: string
  showBack?: boolean
  theme: Theme
  onToggleTheme: () => void
  actions?: React.ReactNode
}

export function Header({ title, showBack, theme, onToggleTheme, actions }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <ChevronLeft size={24} />
            <span className={styles.backLabel}>Back</span>
          </button>
        )}
      </div>
      {title && <h1 className={styles.title}>{title}</h1>}
      <div className={styles.actions}>
        {actions}
        <button className={styles.iconBtn} onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}
