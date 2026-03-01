import { useState, useCallback } from 'react'
import { Header } from '../components/Header'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { db, type Contact } from '../lib/db'
import { seedDatabase } from '../lib/seed'
import {
  isConnected,
  getLastBackupTime,
  startOAuth,
  clearAuth,
  backupToDrive,
} from '../lib/gdrive'
import {
  Download,
  Upload,
  Trash2,
  RotateCcw,
  ChevronRight,
  CloudUpload,
  Check,
  Unplug,
} from 'lucide-react'
import type { Theme } from '../lib/theme'
import styles from './SettingsScreen.module.css'

interface SettingsScreenProps {
  theme: Theme
  onToggleTheme: () => void
}

function formatBackupTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString()
}

export function SettingsScreen({ theme, onToggleTheme }: SettingsScreenProps) {
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [gdriveConnected, setGdriveConnected] = useState(isConnected)
  const [lastBackup, setLastBackup] = useState(getLastBackupTime)
  const [backingUp, setBackingUp] = useState(false)

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
      showStatus('error', 'Failed to restore')
    }
  }

  const handleConnectGdrive = () => {
    startOAuth()
  }

  const handleDisconnectGdrive = () => {
    clearAuth()
    setGdriveConnected(false)
    setLastBackup(null)
    showStatus('success', 'Google Drive disconnected')
  }

  const handleManualBackup = useCallback(async () => {
    setBackingUp(true)
    try {
      await backupToDrive()
      setLastBackup(Date.now())
      showStatus('success', 'Backed up to Google Drive')
    } catch {
      showStatus('error', 'Backup failed — try reconnecting')
    } finally {
      setBackingUp(false)
    }
  }, [])

  return (
    <div className={styles.page}>
      <Header title="Settings" showBack theme={theme} onToggleTheme={onToggleTheme} />
      <div className={styles.body}>
        {status && (
          <div className={`${styles.toast} ${styles[status.type]}`}>
            {status.text}
          </div>
        )}

        <div className={styles.sectionLabel}>Backup</div>
        <div className={styles.card}>
          <button className={styles.row} onClick={handleExport}>
            <Download size={20} className={styles.rowIconAccent} />
            <span className={styles.rowText}>Export Contacts</span>
            <ChevronRight size={16} className={styles.chevron} />
          </button>
          <div className={styles.divider} />
          <button className={styles.row} onClick={handleImport}>
            <Upload size={20} className={styles.rowIconAccent} />
            <span className={styles.rowText}>Import Contacts</span>
            <ChevronRight size={16} className={styles.chevron} />
          </button>
        </div>

        <div className={styles.sectionLabel}>Google Drive</div>
        <div className={styles.card}>
          {gdriveConnected ? (
            <>
              <div className={styles.row}>
                <Check size={20} className={styles.rowIconSuccess} />
                <div className={styles.rowTextCol}>
                  <span className={styles.rowText}>Connected</span>
                  {lastBackup && (
                    <span className={styles.rowSub}>
                      Last backup: {formatBackupTime(lastBackup)}
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.divider} />
              <button
                className={styles.row}
                onClick={handleManualBackup}
                disabled={backingUp}
              >
                <CloudUpload size={20} className={styles.rowIconAccent} />
                <span className={styles.rowText}>
                  {backingUp ? 'Backing up...' : 'Backup Now'}
                </span>
                <ChevronRight size={16} className={styles.chevron} />
              </button>
              <div className={styles.divider} />
              <button className={styles.row} onClick={handleDisconnectGdrive}>
                <Unplug size={20} className={styles.rowIconDanger} />
                <span className={styles.rowTextDanger}>Disconnect</span>
                <ChevronRight size={16} className={styles.chevron} />
              </button>
            </>
          ) : (
            <button className={styles.row} onClick={handleConnectGdrive}>
              <CloudUpload size={20} className={styles.rowIconAccent} />
              <span className={styles.rowText}>Connect Google Drive</span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
          )}
        </div>

        <div className={styles.sectionLabel}>Data</div>
        <div className={styles.card}>
          <button className={styles.row} onClick={handleReseed}>
            <RotateCcw size={20} className={styles.rowIconAccent} />
            <span className={styles.rowText}>Restore Sample Data</span>
            <ChevronRight size={16} className={styles.chevron} />
          </button>
          <div className={styles.divider} />
          <button className={styles.row} onClick={() => setShowClearConfirm(true)}>
            <Trash2 size={20} className={styles.rowIconDanger} />
            <span className={styles.rowTextDanger}>Delete All Contacts</span>
            <ChevronRight size={16} className={styles.chevron} />
          </button>
        </div>

        <p className={styles.footer}>Rolodex — your data stays on this device.</p>
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
