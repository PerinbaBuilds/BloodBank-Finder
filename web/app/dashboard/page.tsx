"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "DONOR") router.replace("/dashboard/donor");
    else if (user.role === "HOSPITAL" || user.role === "BLOOD_BANK") router.replace("/dashboard/organization");
    else if (user.role === "ADMIN") router.replace("/admin");
  }, [user, isLoading, router]);

  return <Spinner />;
}
