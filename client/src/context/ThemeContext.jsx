import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    const html = document.documentElement;
    // Remove previous theme classes
    html.className = html.className.replace(/\btheme-\S+/g, '').trim();
    // Add current theme class
    html.classList.add(`theme-${theme}`);
    
    // Save selection
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const value = {
    theme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
