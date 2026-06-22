import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../lib/api";
import { clearToken, getToken, setToken } from "../lib/storage";
import type {
  AuthResponse,
  Donor,
  Organization,
  PublicUser,
  RegisterDonorPayload,
  RegisterOrganizationPayload,
} from "../lib/types";

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
  const [state, setState] = useState<AuthState>(EMPTY_STATE);

  const loadMe = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setState({ user: null, donor: null, organization: null, isLoading: false });
      return;
    }
    try {
      const data = await authApi.me();
      setState({ user: data.user, donor: data.donor ?? null, organization: data.organization ?? null, isLoading: false });
    } catch {
      await clearToken();
      setState({ user: null, donor: null, organization: null, isLoading: false });
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const applyAuthResponse = useCallback(async (data: AuthResponse) => {
    await setToken(data.token);
    setState({ user: data.user, donor: data.donor ?? null, organization: data.organization ?? null, isLoading: false });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      await applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const registerDonor = useCallback(
    async (input: RegisterDonorPayload) => {
      const data = await authApi.registerDonor(input);
      await applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const registerOrganization = useCallback(
    async (input: RegisterOrganizationPayload) => {
      const data = await authApi.registerOrganization(input);
      await applyAuthResponse(data);
    },
    [applyAuthResponse]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout, still clear local state
    } finally {
      await clearToken();
      setState({ user: null, donor: null, organization: null, isLoading: false });
    }
  }, []);

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
