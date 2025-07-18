import React, { createContext, useState, useContext, useEffect } from "react";

// Create a context for the theme
const ThemeContext = createContext();

// Create a provider component
export const ThemeProvider = ({ children }) => {
  // Check if there's a saved theme preference in localStorage
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : true; // Default to dark theme
  });

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");

    // Apply theme to the document body and html element
    if (isDarkTheme) {
      document.documentElement.classList.add("dark-theme");
      document.documentElement.classList.remove("light-theme");
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.documentElement.classList.add("light-theme");
      document.documentElement.classList.remove("dark-theme");
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
  }, [isDarkTheme]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkTheme((prevTheme) => !prevTheme);
  };

  // Provide the theme state and toggle function to children
  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
