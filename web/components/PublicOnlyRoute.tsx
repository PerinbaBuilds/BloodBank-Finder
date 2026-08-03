"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Guards pages that only make sense when signed OUT (login, register).
 * A signed-in user who lands here is redirected to their dashboard instead of,
 * e.g., being able to create a second account on top of their live session.
 */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading || user) return <Spinner />;

  return <>{children}</>;
}
