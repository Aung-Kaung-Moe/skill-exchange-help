import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">SkillBridge</h1>
        <p className="max-w-2xl text-slate-600">
          A campus skill exchange foundation with secure student authentication.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {session ? (
          <>
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              Signed in as {session.user?.name}
            </p>
            <Link
              href="/posts"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Posts
            </Link>
            <Link
              href="/posts/new"
              className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Create Post
            </Link>
            <Link
              href="/bookings"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              My Bookings
            </Link>
            <Link
              href="/messages"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Messages
            </Link>
            <Link
              href="/notifications"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Notifications
            </Link>
            <Link
              href="/profile/me"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              View My Profile
            </Link>
            <Link
              href="/profile/edit"
              className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Create or Edit Profile
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/posts"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Posts
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Create Account
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
