import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, LoginRequest, SignupRequest } from "../types";
import { authApi } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (credentials: SignupRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      // In a real app, you'd validate the token and get user info
      // For simplicity, we'll just set loading to false
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      const { access_token } = response;

      setToken(access_token);
      localStorage.setItem("token", access_token);

      // In a real app, you'd decode the JWT or make another API call to get user info
      // For simplicity, we'll create a mock user object
      setUser({
        id: 1,
        email: credentials.email,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      throw error;
    }
  };

  const signup = async (credentials: SignupRequest) => {
    try {
      await authApi.signup(credentials);
      // Auto-login after signup
      await login(credentials);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
