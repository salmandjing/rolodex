import { db } from './db'

const CLIENT_ID =
  '881463877543-dlbc9tf9q7pk5q3f979gcusdgbrnhu1e.apps.googleusercontent.com'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files'
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'

const LS_TOKEN = 'rolodex-gdrive-token'
const LS_TOKEN_EXPIRY = 'rolodex-gdrive-token-expiry'
const LS_FILE_ID = 'rolodex-gdrive-file-id'
const LS_LAST_BACKUP = 'rolodex-gdrive-last-backup'

// ── Auth ──────────────────────────────────────────────

function getRedirectUri(): string {
  const origin = window.location.origin
  if (origin.includes('localhost')) return 'http://localhost:5173/'
  return 'https://djsalman-xps-17-9720.tail1f2c6b.ts.net/'
}

export function getToken(): string | null {
  const token = localStorage.getItem(LS_TOKEN)
  const expiry = localStorage.getItem(LS_TOKEN_EXPIRY)
  if (!token || !expiry) return null
  if (Date.now() > Number(expiry)) {
    // Token expired — clear it
    clearAuth()
    return null
  }
  return token
}

export function isConnected(): boolean {
  return getToken() !== null
}

export function getLastBackupTime(): number | null {
  const t = localStorage.getItem(LS_LAST_BACKUP)
  return t ? Number(t) : null
}

export function startOAuth(): void {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** Call on app load to capture the token from the URL hash after OAuth redirect. */
export function handleOAuthRedirect(): boolean {
  const hash = window.location.hash
  if (!hash.includes('access_token')) return false

  const params = new URLSearchParams(hash.substring(1))
  const token = params.get('access_token')
  const expiresIn = params.get('expires_in')

  if (token && expiresIn) {
    localStorage.setItem(LS_TOKEN, token)
    localStorage.setItem(
      LS_TOKEN_EXPIRY,
      String(Date.now() + Number(expiresIn) * 1000)
    )
    // Clean the hash from the URL
    window.history.replaceState(null, '', window.location.pathname)
    return true
  }
  return false
}

export function clearAuth(): void {
  localStorage.removeItem(LS_TOKEN)
  localStorage.removeItem(LS_TOKEN_EXPIRY)
  localStorage.removeItem(LS_FILE_ID)
  localStorage.removeItem(LS_LAST_BACKUP)
}

// ── Drive API ─────────────────────────────────────────

async function findExistingFile(token: string): Promise<string | null> {
  const cached = localStorage.getItem(LS_FILE_ID)
  if (cached) {
    // Verify the file still exists
    const res = await fetch(`${DRIVE_FILES_URL}/${cached}?fields=id`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) return cached
    // File was deleted, clear cache
    localStorage.removeItem(LS_FILE_ID)
  }

  // Search for file by name
  const q = encodeURIComponent("name = 'rolodex-backup.json' and trashed = false")
  const res = await fetch(`${DRIVE_FILES_URL}?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  const fileId: string | undefined = data.files?.[0]?.id
  if (fileId) localStorage.setItem(LS_FILE_ID, fileId)
  return fileId ?? null
}

async function createFile(token: string, content: string): Promise<string> {
  const metadata = {
    name: 'rolodex-backup.json',
    mimeType: 'application/json',
  }

  const boundary = '----RolodexBoundary'
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`

  const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`)
  const data = await res.json()
  localStorage.setItem(LS_FILE_ID, data.id)
  return data.id
}

async function updateFile(
  token: string,
  fileId: string,
  content: string
): Promise<void> {
  const res = await fetch(
    `${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: content,
    }
  )
  if (!res.ok) throw new Error(`Drive update failed: ${res.status}`)
}

export async function backupToDrive(): Promise<void> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated with Google Drive')

  const contacts = await db.contacts.toArray()
  const content = JSON.stringify(contacts, null, 2)

  const existingId = await findExistingFile(token)

  if (existingId) {
    await updateFile(token, existingId, content)
  } else {
    await createFile(token, content)
  }

  localStorage.setItem(LS_LAST_BACKUP, String(Date.now()))
}

// ── Debounced auto-backup ─────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

export function triggerDebouncedBackup(): void {
  if (!isConnected()) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    backupToDrive().catch((err) => {
      console.warn('[Rolodex] Auto-backup to Google Drive failed:', err)
    })
  }, 5000)
}

// ── Dexie hooks ───────────────────────────────────────

export function installBackupHooks(): void {
  db.contacts.hook('creating', () => {
    triggerDebouncedBackup()
  })

  db.contacts.hook('updating', () => {
    triggerDebouncedBackup()
  })

  db.contacts.hook('deleting', () => {
    triggerDebouncedBackup()
  })
}
