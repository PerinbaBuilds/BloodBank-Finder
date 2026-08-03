"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound } from "lucide-react";
import { ApiError, authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (done) {
    return (
      <Card className="mt-6 animate-fade-in-up">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <p className="text-sm text-zinc-700">Your password has been reset. You can now sign in with it.</p>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </div>
      </Card>
    );
  }

  if (!token) {
    return (
      <Card className="mt-6 animate-fade-in-up">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-zinc-700">
            This reset link is missing or invalid. Please request a new one from the forgot-password page.
          </p>
          <Link href="/forgot-password" className="w-full">
            <Button variant="outline" className="w-full">
              Request a new link
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <Input
          label="Confirm new password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Reset password
        </Button>
      </form>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="text-center">
        <span className="animate-fade-in-up mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lifted">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="animate-fade-in-up mt-4 text-2xl font-bold text-zinc-900">Set a new password</h1>
        <p className="animate-fade-in-up mt-1 text-sm text-zinc-500">Choose a new password for your account.</p>
      </div>

      <Suspense fallback={<Card className="mt-6">Loading…</Card>}>
        <ResetPasswordForm />
      </Suspense>

      <p className="animate-fade-in-up mt-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-medium text-red-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
