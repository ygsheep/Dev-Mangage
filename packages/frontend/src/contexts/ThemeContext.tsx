import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { ThemeConfig, ThemeName, defaultTheme, themes } from '../config/themes'

interface ThemeContextType {
  theme: ThemeConfig
  themeName: ThemeName
  setTheme: (themeName: ThemeName) => void
  isDark: boolean
  toggleDarkMode: () => void
  availableThemes: typeof themes
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    // 检测是否在Electron环境中，如果是则默认使用暗色主题
    const isElectron = typeof window !== 'undefined' && window.electronAPI
    const savedTheme = localStorage.getItem('devapi-theme')
    return (savedTheme as ThemeName) || (isElectron ? 'dark' : defaultTheme)
  })

  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Electron环境默认暗色模式
    const isElectron = typeof window !== 'undefined' && window.electronAPI
    const savedDarkMode = localStorage.getItem('devapi-dark-mode')
    return savedDarkMode !== null ? savedDarkMode === 'true' : isElectron
  })

  // 获取当前主题配置
  const currentTheme = isDarkMode && themeName !== 'dark' ? themes.dark : themes[themeName]

  // 设置主题
  const setTheme = (newThemeName: ThemeName) => {
    setThemeName(newThemeName)
    localStorage.setItem('devapi-theme', newThemeName)

    // 如果设置为暗色主题，同时开启暗色模式
    if (newThemeName === 'dark') {
      setIsDarkMode(true)
      localStorage.setItem('devapi-dark-mode', 'true')
    }
  }

  // 切换暗色模式
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('devapi-dark-mode', String(newDarkMode))
  }

  // 应用主题到CSS变量
  useEffect(() => {
    const root = document.documentElement
    const theme = currentTheme

    // 设置暗色模式类名
    if (isDarkMode) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 设置CSS变量
    root.style.setProperty('--color-primary-50', theme.colors.primary[50])
    root.style.setProperty('--color-primary-100', theme.colors.primary[100])
    root.style.setProperty('--color-primary-200', theme.colors.primary[200])
    root.style.setProperty('--color-primary-300', theme.colors.primary[300])
    root.style.setProperty('--color-primary-400', theme.colors.primary[400])
    root.style.setProperty('--color-primary-500', theme.colors.primary[500])
    root.style.setProperty('--color-primary-600', theme.colors.primary[600])
    root.style.setProperty('--color-primary-700', theme.colors.primary[700])
    root.style.setProperty('--color-primary-800', theme.colors.primary[800])
    root.style.setProperty('--color-primary-900', theme.colors.primary[900])
    root.style.setProperty('--color-primary-50', '#262626')

    // 背景色
    root.style.setProperty('--color-bg-primary', theme.colors.background.primary)
    root.style.setProperty('--color-bg-secondary', theme.colors.background.secondary)
    root.style.setProperty('--color-bg-tertiary', theme.colors.background.tertiary)
    root.style.setProperty('--color-bg-paper', theme.colors.background.paper)
    root.style.setProperty('--color-bg-elevated', theme.colors.background.elevated)
    root.style.setProperty('--color-bg-code', theme.colors.background.code)

    // 文字色
    root.style.setProperty('--color-text-primary', theme.colors.text.primary)
    root.style.setProperty('--color-text-secondary', theme.colors.text.secondary)
    root.style.setProperty('--color-text-tertiary', theme.colors.text.tertiary)
    root.style.setProperty('--color-text-inverse', theme.colors.text.inverse)
    root.style.setProperty('--color-text-link', theme.colors.text.link)

    // 边框色
    root.style.setProperty('--color-border-primary', theme.colors.border.primary)
    root.style.setProperty('--color-border-secondary', theme.colors.border.secondary)
    root.style.setProperty('--color-border-focus', theme.colors.border.focus)
    root.style.setProperty('--color-border-error', theme.colors.border.error)
    root.style.setProperty('--color-border-success', theme.colors.border.success)

    // 状态色
    root.style.setProperty('--color-status-success', theme.colors.status.success)
    root.style.setProperty('--color-status-warning', theme.colors.status.warning)
    root.style.setProperty('--color-status-error', theme.colors.status.error)
    root.style.setProperty('--color-status-info', theme.colors.status.info)

    // 阴影色
    root.style.setProperty('--color-shadow-sm', theme.colors.shadow.sm)
    root.style.setProperty('--color-shadow-md', theme.colors.shadow.md)
    root.style.setProperty('--color-shadow-lg', theme.colors.shadow.lg)
    root.style.setProperty('--color-shadow-xl', theme.colors.shadow.xl)

    // 渐变色
    root.style.setProperty('--gradient-header', theme.colors.gradient.header)
    root.style.setProperty('--gradient-header-from', theme.colors.gradient.headerFrom)
    root.style.setProperty('--gradient-header-to', theme.colors.gradient.headerTo)
    root.style.setProperty('--gradient-card', theme.colors.gradient.card)
    root.style.setProperty('--gradient-card-from', theme.colors.gradient.cardFrom)
    root.style.setProperty('--gradient-card-to', theme.colors.gradient.cardTo)

    // 圆角
    root.style.setProperty('--radius-sm', theme.borderRadius.sm)
    root.style.setProperty('--radius-md', theme.borderRadius.md)
    root.style.setProperty('--radius-lg', theme.borderRadius.lg)
    root.style.setProperty('--radius-xl', theme.borderRadius.xl)
    root.style.setProperty('--radius-2xl', theme.borderRadius['2xl'])
    root.style.setProperty('--radius-full', theme.borderRadius.full)

    // 样式
    root.style.setProperty('--card-shadow', theme.style.cardShadow)
    root.style.setProperty('--hover-transition', theme.style.hoverTransition)
    root.style.setProperty('--focus-ring', theme.style.focusRing)

    // 设置HTML的class用于CSS选择器
    root.className = isDarkMode ? 'dark' : 'light'

    // 更新body背景色
    document.body.style.backgroundColor = theme.colors.background.secondary
    document.body.style.color = theme.colors.text.primary
  }, [currentTheme, isDarkMode])

  const value: ThemeContextType = {
    theme: currentTheme,
    themeName,
    setTheme,
    isDark: isDarkMode,
    toggleDarkMode,
    availableThemes: themes,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeProvider
