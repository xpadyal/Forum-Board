"use client";

import { useState, useEffect } from "react";
import { isAuthenticated, getUser } from "@/lib/authApi";

/**
 * Custom hook to manage authentication state
 * @returns {Object} { isAuth, user, isLoading }
 */
export function useAuth() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      setUser(authenticated ? getUser() : null);
      setIsLoading(false);
    };

    checkAuth();

    const handleAuthStateChange = () => {
      checkAuth();
    };

    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("authStateChange", handleAuthStateChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("authStateChange", handleAuthStateChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return { isAuth, user, isLoading };
}

