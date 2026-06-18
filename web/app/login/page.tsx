"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-bold text-zinc-900">Welcome back</h1>
      <p className="mt-1 text-sm text-zinc-500">Sign in to manage your donations or requests.</p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Login
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-red-600 hover:underline">
          Register
        </Link>
      </p>

      <Card className="mt-8 bg-zinc-50 text-xs text-zinc-500">
        <p className="font-semibold text-zinc-700">Demo credentials</p>
        <p className="mt-1">
          All demo accounts use password: <code className="font-mono">Password123!</code>
        </p>
        <p className="mt-1">Admin: admin@bloodbankfinder.org</p>
        <p>Blood bank: central@bloodbank.demo</p>
        <p>Hospital: mylapore@hospital.demo</p>
        <p>Donor: donor1@demo.com</p>
      </Card>
    </div>
  );
}
