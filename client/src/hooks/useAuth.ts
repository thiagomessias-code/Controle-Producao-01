import { useEffect, useState } from "react";
import { useError } from "@/contexts/ErrorContext";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const { showError } = useError();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const userStr = localStorage.getItem("auth_user");
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        showError("Erro ao carregar sessão");
      }
    };

    checkAuth();
  }, []);

  const login = async (data: { email: string; password: string }) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    try {
      // Mock authentication
      if (data.password === "error") {
        throw new Error("Credenciais inválidas. Verifique seu e-mail e senha.");
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.email.split("@")[0],
      };

      const token = `token_${Date.now()}`;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });

      return { user, token };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer login";
      setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }));
      showError(errorMessage);
      throw error;
    }
  };

  const signup = async (data: { email: string; password: string; name: string }) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    try {
      const user: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
      };

      const token = `token_${Date.now()}`;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });

      return { user, token };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao criar conta";
      setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false }));
      showError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer logout";
      setState((prev) => ({ ...prev, isLoading: false }));
      showError(errorMessage);
      throw error;
    }
  };

  return {
    ...state,
    login,
    signup,
    logout,
  };
};
