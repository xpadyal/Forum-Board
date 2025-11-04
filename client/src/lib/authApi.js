import apiClient from "./apiClient";

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Password
 * @returns {Promise} API response with user data
 */
export const register = async (userData) => {
  const response = await apiClient.post("/users/register", userData);
  return response;
};

/**
 * Login user
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - Email address
 * @param {string} credentials.password - Password
 * @returns {Promise} API response with token and user data
 */
export const login = async (credentials) => {
  const response = await apiClient.post("/users/login", credentials);
  return response;
};

/**
 * Store authentication token in localStorage
 * @param {string} token - JWT token
 */
export const storeToken = (token) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

/**
 * Store user information in localStorage
 * @param {Object} user - User object with id, username, email, role
 */
export const storeUser = (user) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("authStateChange", { detail: { user, authenticated: true } }));
  }
};

/**
 * Get user information from localStorage
 * @returns {Object|null} User object or null
 */
export const getUser = () => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

/**
 * Remove user information from localStorage
 */
export const removeUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
  }
};

/**
 * Logout user - removes both token and user info
 */
export const logout = () => {
  removeToken();
  removeUser();
  // Dispatch custom event to notify components of auth state change
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("authStateChange", { detail: { user: null, authenticated: false } }));
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
  return !!getToken();
};

