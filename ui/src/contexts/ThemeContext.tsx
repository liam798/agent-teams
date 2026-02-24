import { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  mode: 'light';
}

const ThemeContext = createContext<ThemeContextType>({ mode: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ mode: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
