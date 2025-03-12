import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export enum UserRole {
  LEAD = "LEAD",
  TEAM = "TEAM"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

// Debug function to log state changes
const logStateChange = (state: Partial<AuthState>) => {
  console.log('Auth state changed:', {
    hasToken: !!state.token,
    hasUser: !!state.user,
    isAuthenticated: state.isAuthenticated
  });
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        console.log('Setting auth with token:', token.substring(0, 10) + '...');
        set({ token, user, isAuthenticated: true });
        logStateChange({ token, user, isAuthenticated: true });
      },
      clearAuth: () => {
        console.log('Clearing auth state');
        set({ token: null, user: null, isAuthenticated: false });
        logStateChange({ token: null, user: null, isAuthenticated: false });
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        return {
          getItem: (name) => {
            const value = localStorage.getItem(name);
            console.log('Loading auth state:', name, value ? 'exists' : 'missing');
            return value ? JSON.parse(value) : null;
          },
          setItem: (name, value) => {
            console.log('Saving auth state:', name);
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            console.log('Removing auth state:', name);
            localStorage.removeItem(name);
          },
        };
      }),
      partialize: (state) => {
        const persistedState = {
          token: state.token,
          user: state.user,
          isAuthenticated: state.isAuthenticated
        };
        console.log('Persisting state:', {
          hasToken: !!persistedState.token,
          hasUser: !!persistedState.user,
          isAuthenticated: persistedState.isAuthenticated
        });
        return persistedState;
      }
    }
  )
);
