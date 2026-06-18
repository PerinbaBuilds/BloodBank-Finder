"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, clearToken, getToken, setToken } from "@/lib/api";
import type {
  AuthResponse,
  Donor,
  Organization,
  PublicUser,
  RegisterDonorPayload,
  RegisterOrganizationPayload,
} from "@/lib/types";

interface AuthState {
  user: PublicUser | null;
  donor: Donor | null;
  organization: Organization | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  registerDonor: (input: RegisterDonorPayload) => Promise<void>;
  registerOrganization: (input: RegisterOrganizationPayload) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const EMPTY_STATE: AuthState = { user: null, donor: null, organization: null, isLoading: true };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>(EMPTY_STATE);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setState({ user: null, donor: null, organization: null, isLoading: false });
      return;
    }
    try {
      const data = await authApi.me();
      setState({ user: data.user, donor: data.donor ?? null, organization: data.organization ?? null, isLoading: false });
    } catch {
      clearToken();
      setState({ user: null, donor: null, organization: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load session on mount is intentional
    loadMe();
  }, [loadMe]);

  const applyAuthResponse = useCallback((data: AuthResponse) => {
    setToken(data.token);
    setState({ user: data.user, donor: data.donor ?? null, organization: data.organization ?? null, isLoading: false });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const registerDonor = useCallback(
    async (input: RegisterDonorPayload) => {
      const data = await authApi.registerDonor(input);
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const registerOrganization = useCallback(
    async (input: RegisterOrganizationPayload) => {
      const data = await authApi.registerOrganization(input);
      applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout, still clear local state
    } finally {
      clearToken();
      setState({ user: null, donor: null, organization: null, isLoading: false });
      router.push("/");
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, registerDonor, registerOrganization, logout, refresh: loadMe }),
    [state, login, registerDonor, registerOrganization, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
