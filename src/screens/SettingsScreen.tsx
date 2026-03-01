import { useState } from 'react'
import { Header } from '../components/Header'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { db, type Contact } from '../lib/db'
import { seedDatabase } from '../lib/seed'
import { Download, Upload, Trash2, RotateCcw } from 'lucide-react'
import type { Theme } from '../lib/theme'
import styles from './SettingsScreen.module.css'

interface SettingsScreenProps {
  theme: Theme
  onToggleTheme: () => void
}

export function SettingsScreen({ theme, onToggleTheme }: SettingsScreenProps) {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatus({ type, text })
    setTimeout(() => setStatus(null), 3000)
  }

  const handleExport = async () => {
    try {
      const contacts = await db.contacts.toArray()
      const data = JSON.stringify(contacts, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rolodex-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showStatus('success', `Exported ${contacts.length} contacts`)
    } catch {
      showStatus('error', 'Export failed')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const contacts: Contact[] = JSON.parse(text)
        if (!Array.isArray(contacts)) throw new Error('Invalid format')
        // Validate at least basic fields
        for (const c of contacts) {
          if (!c.id || !c.firstName) throw new Error('Invalid contact data')
        }
        await db.contacts.bulkPut(contacts)
        showStatus('success', `Imported ${contacts.length} contacts`)
      } catch {
        showStatus('error', 'Import failed — invalid file format')
      }
    }
    input.click()
  }

  const handleClearAll = async () => {
    try {
      await db.contacts.clear()
      setShowClearConfirm(false)
      showStatus('success', 'All contacts deleted')
    } catch {
      showStatus('error', 'Failed to clear contacts')
    }
  }

  const handleReseed = async () => {
    try {
      await db.contacts.clear()
      await seedDatabase()
      showStatus('success', 'Sample contacts restored')
    } catch {
      showStatus('error', 'Failed to reseed')
    }
  }

  return (
    <div className={styles.page}>
      <Header title="Settings" showBack theme={theme} onToggleTheme={onToggleTheme} />
      <div className={styles.body}>
        {status && (
          <div className={`${styles.toast} ${styles[status.type]}`}>
            {status.text}
          </div>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Backup</h2>

          <button className={styles.actionBtn} onClick={handleExport}>
            <Download size={18} />
            <div className={styles.actionText}>
              <span className={styles.actionLabel}>Export Contacts</span>
              <span className={styles.actionDesc}>Download all contacts as a JSON file</span>
            </div>
          </button>

          <button className={styles.actionBtn} onClick={handleImport}>
            <Upload size={18} />
            <div className={styles.actionText}>
              <span className={styles.actionLabel}>Import Contacts</span>
              <span className={styles.actionDesc}>Load contacts from a JSON backup file</span>
            </div>
          </button>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data</h2>

          <button className={styles.actionBtn} onClick={handleReseed}>
            <RotateCcw size={18} />
            <div className={styles.actionText}>
              <span className={styles.actionLabel}>Restore Sample Data</span>
              <span className={styles.actionDesc}>Clear and reload demo contacts</span>
            </div>
          </button>

          <button
            className={`${styles.actionBtn} ${styles.danger}`}
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 size={18} />
            <div className={styles.actionText}>
              <span className={styles.actionLabel}>Delete All Contacts</span>
              <span className={styles.actionDesc}>Permanently remove all data</span>
            </div>
          </button>
        </section>

        <p className={styles.footer}>Rolodex v1.0 — your data stays on this device.</p>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="Delete all contacts?"
          message="This action cannot be undone. All contacts will be permanently removed."
          confirmLabel="Delete All"
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}
