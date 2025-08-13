import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'
import frFR from 'antd/locale/fr_FR'

const ThemeContext = createContext({ isDark: false, toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved ? saved === 'dark' : false
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(prev => !prev)

  const config = useMemo(() => ({
    locale: frFR,
    theme: {
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: '#3b82f6',
        borderRadius: 8,
        fontFamily: "Segoe UI, system-ui, -apple-system, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      },
    },
  }), [isDark])

  const value = useMemo(() => ({ isDark, toggleTheme }), [isDark])

  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider {...config}>{children}</ConfigProvider>
    </ThemeContext.Provider>
  )
}