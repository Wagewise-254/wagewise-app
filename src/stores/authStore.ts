// src/stores/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { API_BASE_URL } from '@/config';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  checkUser: () => void;
  signUp: (email: string, password: string, userName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  checkUser: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ user: session.user, session, loading: false });
    } else {
      set({ user: null, session: null, loading: false });
    }
  },

  signUp: async (email, password, userName) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_name: userName, // You can add custom data like this
        },
      },
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    if (data.user) {
      // After successful sign up, send welcome email via your backend
      await fetch(`${API_BASE_URL}/welcome-email`, { // Your backend URL
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userName }),
      });
      set({ user: data.user, session: data.session, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      throw error;
    }

    if (data.user) {
      set({ user: data.user, session: data.session, loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ user: null, session: null, loading: false });
    }
  },
}));