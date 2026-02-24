import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | '3d';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  is3D: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved === '3d' ? '3d' : 'light') as ThemeMode;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? '3d' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, is3D: mode === '3d' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
