import { createClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
import { supabase } from 'src\\lib\\supabase.ts';

interface AuthState {
  user: any;
  session: any;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signUp: async (email, password, fullName) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

          if (error) throw error;

          if (data.user && data.session) {
            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata.full_name,
                created_at: data.user.created_at!,
              },
              session: data.session,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      signIn: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Fetch user profile from users table
            const { data: profileData, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) throw profileError;

            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata.full_name,
                role: profileData.role,
                created_at: data.user.created_at!,
              },
              session: data.session,
              isAuthenticated: true,
            });
          }
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true, error: null });

          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({ user: null, session: null, isAuthenticated: false });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      getUser: async () => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.getUser();
          if (error) throw error;

          if (data.user) {
            // Fetch user profile from users table
            const { data: profileData, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profileError) throw profileError;

            set({
              user: {
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata.full_name,
                role: profileData.role,
                created_at: data.user.created_at!,
              },
              isAuthenticated: true,
            });
          }
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);