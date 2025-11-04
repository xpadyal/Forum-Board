"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated, getUser, logout } from "@/lib/authApi";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      if (authenticated) {
        setUser(getUser());
      } else {
        setUser(null);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const handleAuthStateChange = (event) => {
      const { authenticated, user: eventUser } = event.detail;
      setIsAuth(authenticated);
      setUser(eventUser);
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
  }, [pathname]);

  const isActive = (path) => pathname === path;

  const handleLogout = () => {
    logout();
    setUser(null);
    setIsAuth(false);
    setIsMobileMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={closeMobileMenu}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="hidden sm:inline">Forum Board</span>
            <span className="sm:hidden">Forum</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              Home
            </Link>

            {isAuth && (
              <Link
                href="/threads/create"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/threads/create")
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                }`}
              >
                Create Thread
              </Link>
            )}

            {!isAuth && (
              <>
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/login")
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/register")
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                  }`}
                >
                  Register
                </Link>
              </>
            )}

            {isAuth && user && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 space-y-2">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              Home
            </Link>

            {isAuth && (
              <Link
                href="/threads/create"
                onClick={closeMobileMenu}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/threads/create")
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                }`}
              >
                Create Thread
              </Link>
            )}

            {!isAuth && (
              <>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/login")
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive("/register")
                      ? "bg-blue-600 dark:bg-blue-500 text-white"
                      : "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                  }`}
                >
                  Register
                </Link>
              </>
            )}

            {isAuth && user && (
              <>
                <div className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>{user.username}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
