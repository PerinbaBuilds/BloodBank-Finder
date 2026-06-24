"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@bloodbankfinder.org" },
  { label: "Blood bank", email: "central@bloodbank.demo" },
  { label: "Hospital", email: "mylapore@hospital.demo" },
  { label: "Donor", email: "donor1@demo.com" },
];
const DEMO_PASSWORD = "Password123!";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

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

  const handleDemoLogin = async (demoEmail: string) => {
    setError("");
    setDemoLoading(demoEmail);
    try {
      await login(demoEmail, DEMO_PASSWORD);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="animate-fade-in-up text-2xl font-bold text-zinc-900">Welcome back</h1>
      <p className="animate-fade-in-up mt-1 text-sm text-zinc-500">Sign in to manage your donations or requests.</p>

      <Card className="mt-6 animate-fade-in-up">
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
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Login
          </Button>
        </form>
      </Card>

      <p className="animate-fade-in-up mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-red-600 hover:underline">
          Register
        </Link>
      </p>

      <Card className="animate-fade-in-up mt-8 bg-zinc-50">
        <p className="text-sm font-semibold text-zinc-700">Quick demo login</p>
        <p className="mt-1 text-xs text-zinc-500">
          Tap an account to sign in instantly. Password: <code className="font-mono">{DEMO_PASSWORD}</code>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="outline"
              size="sm"
              isLoading={demoLoading === account.email}
              disabled={demoLoading !== null}
              onClick={() => handleDemoLogin(account.email)}
              className="hover:-translate-y-0.5"
            >
              {account.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
