import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomeScreen } from './screens/HomeScreen'
import { ContactDetailScreen } from './screens/ContactDetailScreen'
import { ContactFormScreen } from './screens/ContactFormScreen'
import { seedDatabase } from './lib/seed'
import { initTheme, setTheme, type Theme } from './lib/theme'

export default function App() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const t = initTheme()
    setThemeState(t)
    seedDatabase()
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
      </Routes>
    </BrowserRouter>
  )
}
