import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; registered?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isInvalidCredentials = params.error === "CredentialsSignin";
  const showRegisteredHint = params.registered === "1";

  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
        <p className="text-sm text-slate-600">Access your SkillBridge account.</p>
      </div>

      {showRegisteredHint ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Account created successfully. Please sign in.
        </p>
      ) : null}

      <LoginForm initialError={isInvalidCredentials ? "Invalid email or password." : undefined} />

      <p className="text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-medium">
          Create an account
        </Link>
      </p>
    </section>
  );
}
