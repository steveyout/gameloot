import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_KEY = 'gameloot_theme_mode';

// Learning OS Design System Palette (by Tino)
// Primary / Electric Cobalt: #517BFD
// Secondary / Royal Slate: #3659C2
// Playful Accent / Berry Rose: #D25087
// Light Neutral Backdrop: #EDEEF1
// Dark Deep Tone: #060507
// Cool Slate Grey: #979CAF
export const themes = {
  dark: {
    mode: 'dark',
    isDark: true,
    statusBar: 'light',
    statusBarBg: '#0b0c12',
    background: '#0b0c12',
    surface: '#151722',
    surfaceSubtle: '#1d2030',
    surfaceCard: '#151722',
    card: '#151722',
    border: '#23263b',
    borderStrong: '#343852',
    text: '#ffffff',
    textSecondary: '#979caf',
    subtext: '#979caf',
    textMuted: '#686d82',
    primary: '#517bfd',
    primaryGradient: ['#517bfd', '#3659c2'],
    secondary: '#3659c2',
    accent: '#d25087',
    berry: '#d25087',
    gold: '#f59e0b',
    green: '#10b981',
    red: '#ef4444'
  },
  light: {
    mode: 'light',
    isDark: false,
    statusBar: 'dark',
    statusBarBg: '#edeef1',
    background: '#edeef1',
    surface: '#ffffff',
    surfaceSubtle: '#f4f5f8',
    surfaceCard: '#ffffff',
    card: '#ffffff',
    border: '#dce0ec',
    borderStrong: '#cbd1e1',
    text: '#060507',
    textSecondary: '#606474',
    subtext: '#606474',
    textMuted: '#979caf',
    primary: '#517bfd',
    primaryGradient: ['#517bfd', '#3659c2'],
    secondary: '#3659c2',
    accent: '#d25087',
    berry: '#d25087',
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
