import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import styles from './FAB.module.css'

export function FAB() {
  return (
    <Link to="/contact/new" className={styles.fab} aria-label="Add contact">
      <Plus size={24} strokeWidth={2.5} />
    </Link>
  )
}
