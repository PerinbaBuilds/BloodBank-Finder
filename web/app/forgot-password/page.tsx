"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { ApiError, authApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="text-center">
        <span className="animate-fade-in-up mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lifted">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="animate-fade-in-up mt-4 text-2xl font-bold text-zinc-900">Forgot your password?</h1>
        <p className="animate-fade-in-up mt-1 text-sm text-zinc-500">
          Enter the email on your account and we&apos;ll send you a link to reset it.
        </p>
      </div>

      <Card className="mt-6 animate-fade-in-up">
        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-600">
              <MailCheck className="h-5 w-5" />
            </span>
            <p className="text-sm text-zinc-700">
              If an account exists for <span className="font-medium">{email}</span>, a password reset link is on its
              way. Check your inbox (and spam folder).
            </p>
            <p className="text-xs text-zinc-500">The link expires in 60 minutes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Send reset link
            </Button>
          </form>
        )}
      </Card>

      <p className="animate-fade-in-up mt-6 text-center text-sm text-zinc-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-red-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
