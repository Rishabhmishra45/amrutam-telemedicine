
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import type { LoginPayload, RegisterPayload, User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'amrutam_token';
const USER_KEY = 'amrutam_user';

function getSavedUser(): User | null {
  try {
    const saved = sessionStorage.getItem(USER_KEY);
    return saved ? (JSON.parse(saved) as User) : null;
  } catch {
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem(TOKEN_KEY),
  );

  const [user, setUser] = useState<User | null>(getSavedUser);

  function saveSession(accessToken: string, loggedInUser: User) {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setToken(accessToken);
    setUser(loggedInUser);
  }

  async function login(payload: LoginPayload) {
    const result = await api.login(payload);
    saveSession(result.accessToken, result.user);
  }

  async function register(payload: RegisterPayload) {
    const result = await api.register(payload);
    saveSession(result.accessToken, result.user);
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
