import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <section className="mx-auto w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
        <p className="text-sm text-slate-600">Create your SkillBridge student account.</p>
      </div>

      <RegisterForm />

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium">
          Sign in
        </Link>
      </p>
    </section>
  );
}
