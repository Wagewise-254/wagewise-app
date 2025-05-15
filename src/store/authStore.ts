// src/store/authStore.ts (Create a new file for your store)

import { create } from 'zustand';

// Define the shape of the user data you expect to store
interface User {
  id: string;
  email: string;
  // Add any other user properties you get from Supabase/backend
  // e.g., display_name?: string;
}

// Define the shape of the authentication state
interface AuthState {
  user: User | null; // The authenticated user object, or null if not logged in
  accessToken: string | null; // The Supabase access token
  refreshToken: string | null; // The Supabase refresh token
  isAuthenticated: boolean; // Convenience boolean: true if user is not null
  isLoading: boolean; // To track if the auth state is currently loading (e.g., from storage)
  error: string | null; // To store any auth-related errors

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => void; // Action to set the state on login
  logout: () => void; // Action to clear the state on logout
  setLoading: (isLoading: boolean) => void; // Action to set loading state
  setError: (error: string | null) => void; // Action to set error state
  // Optional: Action to initialize state from storage (e.g., localStorage)
  // initializeAuth: () => void;
}

// Create the Zustand store
const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading, assuming we might check storage on app load
  error: null,

  // Action to handle successful login
  login: (user, accessToken, refreshToken) => {
    // Store tokens securely (localStorage is shown here for simplicity,
    // consider more secure options for production Electron apps)
    localStorage.setItem('supabase_access_token', accessToken);
    localStorage.setItem('supabase_refresh_token', refreshToken);
    // You might also store user data if needed, but be cautious
    // localStorage.setItem('user', JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false, // Loading finished after login
      error: null, // Clear any previous errors
    });
  },

  // Action to handle logout
  logout: () => {
    // Clear tokens from storage
    localStorage.removeItem('supabase_access_token');
    localStorage.removeItem('supabase_refresh_token');
    // localStorage.removeItem('user'); // Clear user data if stored

    // Clear state
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false, // Loading finished after logout
      error: null, // Clear any previous errors
    });
    // In a real app, you'd also likely navigate the user away from protected routes
  },

  // Action to set loading state
  setLoading: (isLoading) => set({ isLoading }),

  // Action to set error state
  setError: (error) => set({ error }),

  // Optional: Action to initialize state from storage on app startup
  // initializeAuth: () => {
  //   const accessToken = localStorage.getItem('supabase_access_token');
  //   const refreshToken = localStorage.getItem('supabase_refresh_token');
  //   // const user = localStorage.getItem('user');

  //   if (accessToken && refreshToken) {
  //     // In a real app, you'd want to verify the token validity with your backend/Supabase
  //     // before setting the user. For simplicity, we'll just set the state.
  //     // If you stored user data: const parsedUser = user ? JSON.parse(user) : null;
  //     set({
  //       // user: parsedUser, // Set user from storage
  //       accessToken,
  //       refreshToken,
  //       isAuthenticated: true,
  //       isLoading: false,
  //       error: null,
  //     });
  //   } else {
  //     // No tokens found, user is not authenticated
  //     set({
  //       user: null,
  //       accessToken: null,
  //       refreshToken: null,
  //       isAuthenticated: false,
  //       isLoading: false,
  //       error: null,
  //     });
  //   }
  // },
}));

export default useAuthStore;
