// This is a simple in-memory store for the auth token accessible outside React components.
// In a real-world scenario, for web, HttpOnly cookies managed by the backend are preferred for tokens.
// This service helps bridge the gap for client-side state management and localStorage persistence.

// Define the User type - adjust properties as needed for your application
export interface User {
  id: string;
  email: string;
  name?: string;
  // Add other relevant user properties here
  // e.g., roles, preferences, etc.
}

interface AuthService {
  getToken: () => string | null;
  setToken: (token: string | null) => void;
  getUser: () => User | null;
  setUser: (user: User | null) => void;
  removeUser: () => void;
  isAuthenticated: () => boolean;
  logout: () => void;
}

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

const authService: AuthService = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('AuthService: Failed to get token from localStorage', e);
      return null;
    }
  },
  setToken: (token: string | null) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('AuthService: Failed to set token in localStorage', e);
    }
  },
  getUser: () => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? (JSON.parse(userStr) as User) : null;
    } catch (e) {
      console.error('AuthService: Failed to get user from localStorage', e);
      localStorage.removeItem(USER_KEY); // Clear corrupted data
      return null;
    }
  },
  setUser: (user: User | null) => {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('AuthService: Failed to set user in localStorage', e);
    }
  },
  removeUser: () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('AuthService: Failed to remove user from localStorage', e);
    }
  },
  isAuthenticated: () => {
    try {
      return !!localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('AuthService: Failed to check authentication status from localStorage', e);
      return false;
    }
  },
  logout: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('AuthService: Failed to logout (clear localStorage)', e);
    }
    // Optionally, notify other parts of the app if needed, or redirect globally.
    // For now, AuthContext handles redirection.
  },
};

export default authService;
