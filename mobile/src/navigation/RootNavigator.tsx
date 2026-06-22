import React from "react";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/Spinner";
import { AuthNavigator } from "./AuthNavigator";
import { AppTabs } from "./AppTabs";

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <Spinner />;
  return user ? <AppTabs /> : <AuthNavigator />;
}
