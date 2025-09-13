import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/shared/types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  updatePreferences: (preferences: any) => Promise<boolean>;
  initializeAuth: () => void;
  setLoading: (loading: boolean) => void;
}

interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  password: string;
  preferences?: any;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      initializeAuth: () => {
        const token = get().token;
        const user = get().user;
        
        if (token && user) {
          set({ isAuthenticated: true });
          // Set the token in the API client
          authApi.setToken(token);
        } else {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await authApi.login({ email, password });
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Set token in API client
            authApi.setToken(token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false
            });
            
            toast.success(`Welcome back, ${user.firstName}!`);
            return true;
          } else {
            throw new Error(response.error || 'Login failed');
          }
        } catch (error: any) {
          console.error('Login error:', error);
          toast.error(error.message || 'Login failed. Please try again.');
          set({ isLoading: false });
          return false;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        
        try {
          const response = await authApi.register(userData);
          
          if (response.success && response.data) {
            const { user, token } = response.data;
            
            // Set token in API client
            authApi.setToken(token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false
            });
            
            toast.success(`Welcome to ShopSmart, ${user.firstName}!`);
            return true;
          } else {
            throw new Error(response.error || 'Registration failed');
          }
        } catch (error: any) {
          console.error('Registration error:', error);
          toast.error(error.message || 'Registration failed. Please try again.');
          set({ isLoading: false });
          return false;
        }
      },

      logout: () => {
        // Clear token from API client
        authApi.clearToken();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
        
        toast.success('Logged out successfully');
      },

      updateProfile: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        
        set({ isLoading: true });
        
        try {
          const response = await authApi.updateProfile(updates);
          
          if (response.success && response.data) {
            set({
              user: { ...currentUser, ...response.data },
              isLoading: false
            });
            
            toast.success('Profile updated successfully');
            return true;
          } else {
            throw new Error(response.error || 'Failed to update profile');
          }
        } catch (error: any) {
          console.error('Profile update error:', error);
          toast.error(error.message || 'Failed to update profile');
          set({ isLoading: false });
          return false;
        }
      },

      updatePreferences: async (preferences: any) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        
        set({ isLoading: true });
        
        try {
          const response = await authApi.updatePreferences(preferences);
          
          if (response.success && response.data) {
            set({
              user: { 
                ...currentUser, 
                preferences: response.data 
              },
              isLoading: false
            });
            
            toast.success('Preferences updated successfully');
            return true;
          } else {
            throw new Error(response.error || 'Failed to update preferences');
          }
        } catch (error: any) {
          console.error('Preferences update error:', error);
          toast.error(error.message || 'Failed to update preferences');
          set({ isLoading: false });
          return false;
        }
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);