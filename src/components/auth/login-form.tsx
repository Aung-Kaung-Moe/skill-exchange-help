"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validations/auth";

type LoginFormProps = {
  initialError?: string;
};

export function LoginForm({ initialError }: LoginFormProps) {
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const parsed = loginSchema.safeParse({
          email: formData.get("email"),
          password: formData.get("password")
        });

        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid login data.");
          return;
        }

        setError(null);

        startTransition(async () => {
          const result = await signIn("credentials", {
            ...parsed.data,
            redirect: false,
            callbackUrl: "/"
          });

          if (result?.error) {
            setError("Invalid email or password.");
            return;
          }

          window.location.href = result?.url ?? "/";
        });
      }}
    >
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={1}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-600 focus:outline-none focus:ring-1 focus:ring-sky-600"
        />
      </div>

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
