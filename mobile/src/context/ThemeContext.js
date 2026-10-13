import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_KEY = 'gameloot_theme_mode';

export const themes = {
  dark: {
    mode: 'dark',
    isDark: true,
    statusBar: 'light',
    statusBarBg: '#090d16',
    background: '#090d16',
    surface: '#0f172a',
    surfaceSubtle: '#1e293b',
    surfaceCard: '#0f172a',
    card: '#0f172a',
    border: '#1e293b',
    borderStrong: '#334155',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    subtext: '#94a3b8',
    textMuted: '#64748b',
    primary: '#06b6d4',
    accent: '#3b82f6',
    gold: '#fbbf24',
    green: '#10b981',
    red: '#ef4444'
  },
  light: {
    mode: 'light',
    isDark: false,
    statusBar: 'dark',
    statusBarBg: '#f8fafc',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSubtle: '#f1f5f9',
    surfaceCard: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textSecondary: '#475569',
    subtext: '#475569',
    textMuted: '#64748b',
    primary: '#0891b2',
    accent: '#2563eb',
    gold: '#d97706',
    green: '#059669',
    red: '#dc2626'
  }
};

const ThemeContext = createContext({
  theme: themes.dark,
  themeMode: 'dark',
  isDark: true,
  colors: themes.dark,
  toggleTheme: () => {},
  setTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setCurrentTheme(saved);
      }
    }).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    AsyncStorage.setItem(THEME_KEY, nextTheme).catch(() => {});
  };

  const setTheme = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setCurrentTheme(mode);
      AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
    }
  };

  const activeColors = themes[currentTheme] || themes.dark;

  return (
    <ThemeContext.Provider
      value={{
        theme: activeColors,
        themeMode: currentTheme,
        isDark: currentTheme === 'dark',
        colors: activeColors,
        toggleTheme,
        setTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
