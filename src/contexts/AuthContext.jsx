import { createContext, useState, useEffect } from "react";

// Create the context
export const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // On app mount, check localStorage for token
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    setIsLoggedIn(!!token);
  }, []);

  // Function to login
  const login = (token) => {
    localStorage.setItem("adminToken", token);
    setIsLoggedIn(true);
  };

  // Function to logout
  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
