import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const api = axios.create({
  baseURL: "http://localhost:3333",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("access_token");
      Cookies.remove("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get("access_token");
    const savedUser = Cookies.get("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        Cookies.remove("access_token");
        Cookies.remove("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/login", { email, password });

      if (response.data.user && response.data.accessToken) {
        const { user: userData, accessToken } = response.data;

        console.log("🔑 Storing token:", accessToken?.substring(0, 20) + "...");
        Cookies.set("access_token", accessToken, {
          expires: 1,
          sameSite: "strict",
        });
        Cookies.set("user", JSON.stringify(userData), {
          expires: 1,
          sameSite: "strict",
        });

        // Verify the token was stored
        const storedToken = Cookies.get("access_token");

        console.log(
          "🔑 Token verification:",
          storedToken ? "Stored successfully" : "Failed to store",
        );

        setUser(userData);

        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.message || "Login failed",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Network error occurred";

      return { success: false, error: errorMessage };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post("/register", { name, email, password });

      if (response.data.user) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data.message || "Registration failed",
        };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Network error occurred";

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await api.post("/logout");
    } catch {
    } finally {
      Cookies.remove("access_token");
      Cookies.remove("user");
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
