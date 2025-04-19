import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  email: string;
  phone_number: string; 
  full_name?: string;
  role?: string;
  is_admin?: boolean;
  is_verified?: boolean;
  created_at?: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  token_type: string;
}

interface ErrorResponse {
  message: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signUp: (phone: string, password: string, fullName: string) => Promise<void>;
  signIn: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: () => Promise<void>;
}

// Get the API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signUp: async (phone, password, fullName) => {
        try {
          set({ isLoading: true, error: null });

          const response = await axios.post(`${API_URL}/auth/signup`, {
            phone, 
            password, 
            fullName
          });

          const { user, session } = response.data;

          set({
            user,
            session,
            isAuthenticated: true,
            error: null
          });
          
          // Set the token in axios defaults for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          
        } catch (error) {
          const axiosError = error as AxiosError<ErrorResponse>;
          set({ 
            error: axiosError.response?.data?.message || 'Sign up failed',
            isAuthenticated: false 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      signIn: async (phone, password) => {
        try {
          set({ isLoading: true, error: null });

          const response = await axios.post(`${API_URL}/auth/signin`, {
            phone,
            password
          });

          const { user, session } = response.data;

          set({
            user,
            session,
            isAuthenticated: true,
            error: null
          });
          
          // Set the token in axios defaults for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
          
        } catch (error) {
          const axiosError = error as AxiosError<ErrorResponse>;
          set({ 
            error: axiosError.response?.data?.message || 'Sign in failed',
            isAuthenticated: false 
          });
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        try {
          set({ isLoading: true });
          
          // Optional: Call the backend to invalidate the token
          // await axios.post(`${API_URL}/auth/signout`);
          
          // Clear axios auth header
          delete axios.defaults.headers.common['Authorization'];
          
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            error: null
          });
        } catch (error) {
          const axiosError = error as AxiosError<ErrorResponse>;
          set({ error: axiosError.response?.data?.message || 'Sign out failed' });
        } finally {
          set({ isLoading: false });
        }
      },

      getUser: async () => {
        const { session } = get();
        if (!session) return;
        
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          
          set({
            user: response.data,
            isAuthenticated: true,
            error: null
          });
        } catch (error) {
          const axiosError = error as AxiosError<ErrorResponse>;
          // If token is expired or invalid, clear the session
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            set({
              user: null,
              session: null,
              isAuthenticated: false
            });
          }
          set({ error: axiosError.response?.data?.message || 'Failed to get user data' });
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Initialize axios with the token if it exists
const { session } = useAuthStore.getState();
if (session?.access_token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
}