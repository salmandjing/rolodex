import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
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
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.actions}>
        {actions}
        <button className={styles.iconBtn} onClick={onToggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
