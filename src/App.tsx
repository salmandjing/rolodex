import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { ContactDetailScreen } from './screens/ContactDetailScreen'
import { ContactFormScreen } from './screens/ContactFormScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { seedDatabase } from './lib/seed'
import { getStoredTheme, setTheme, type Theme } from './lib/theme'
import { handleOAuthRedirect, installBackupHooks } from './lib/gdrive'

// Install Dexie hooks once at module level
installBackupHooks()

export default function App() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = getStoredTheme()
    setTheme(t)
    return t
  })

  useEffect(() => {
    seedDatabase()
    handleOAuthRedirect()
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomeScreen theme={theme} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/contact/new"
          element={<ContactFormScreen theme={theme} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/contact/:id"
          element={<ContactDetailScreen theme={theme} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/contact/:id/edit"
          element={<ContactFormScreen theme={theme} onToggleTheme={toggleTheme} />}
        />
        <Route
          path="/settings"
          element={<SettingsScreen theme={theme} onToggleTheme={toggleTheme} />}
        />
      </Routes>
    </BrowserRouter>
  )
}
