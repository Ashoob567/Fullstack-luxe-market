// ============================================================
// services/authService.ts
// ============================================================

import api from "@/lib/api";
import { saveTokens, clearTokens } from "@/lib/auth";
import {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  UserProfile,
  ChangePasswordPayload,
} from "@/types";

export const login = async (payload: LoginPayload): Promise<AuthTokens> => {
  const { data } = await api.post<AuthTokens>("/auth/login/", payload);
  saveTokens(data);
  return data;
};

export const register = async (payload: RegisterPayload): Promise<AuthTokens> => {
  const { data } = await api.post<AuthTokens>("/auth/register/", payload);
  saveTokens(data);
  return data;
};

export const logout = (): void => {
  clearTokens();
};

export const getProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get<UserProfile>("/auth/profile/");
  return data;
};

export const updateProfile = async (
  payload: Partial<Pick<UserProfile, "first_name" | "last_name" | "phone">>
): Promise<UserProfile> => {
  const { data } = await api.patch<UserProfile>("/auth/profile/", payload);
  return data;
};

export const changePassword = async (
  payload: ChangePasswordPayload
): Promise<void> => {
  await api.post("/auth/change-password/", payload);
};