import { useError } from "@/contexts/ErrorContext";
import supabaseClient from "@/api/supabaseClient";
import { useAuthContext } from "@/contexts/AuthContext";

export type { User } from "@/contexts/AuthContext";

export const useAuth = () => {
  const { showError } = useError();
  const { user, isLoading, login: setAuthUser, logout: clearAuthUser } = useAuthContext();

  const login = async (data: { email: string; password: string }) => {
    try {
      const response = await supabaseClient.post("/auth/login", data);
      const { user, token } = response;

      localStorage.setItem("auth_token", token);
      setAuthUser(user);

      return { user, token };
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message || (error as Error).message || "Erro ao fazer login";
      showError(errorMessage);
      throw error;
    }
  };

  const signup = async (data: { email: string; password: string; name: string }) => {
    try {
      const response = await supabaseClient.post("/auth/register", data);
      return response;
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message || (error as Error).message || "Erro ao criar conta";
      showError(errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("auth_token");
      clearAuthUser();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      return await supabaseClient.post("/auth/forgot-password", { email });
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message || (error as Error).message || "Erro ao solicitar recuperação";
      showError(errorMessage);
      throw error;
    }
  };

  const resetPassword = async (data: any) => {
    try {
      return await supabaseClient.post("/auth/reset-password", data);
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.message || (error as Error).message || "Erro ao redefinir senha";
      showError(errorMessage);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
  };
};

