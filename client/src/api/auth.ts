import { supabaseClient } from "./supabaseClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return supabaseClient.post<LoginResponse>("/auth/login", data);
  },

  signup: async (data: SignupRequest): Promise<LoginResponse> => {
    return supabaseClient.post<LoginResponse>("/auth/signup", data);
  },

  logout: async (): Promise<void> => {
    supabaseClient.clearToken();
  },

  getCurrentUser: async (): Promise<LoginResponse["user"]> => {
    return supabaseClient.get("/auth/me");
  },

  refreshToken: async (): Promise<LoginResponse> => {
    return supabaseClient.post<LoginResponse>("/auth/refresh");
  },
};
