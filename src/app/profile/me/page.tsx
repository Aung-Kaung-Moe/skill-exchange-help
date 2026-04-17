import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { getOwnStudentProfile } from "@/lib/profile/profile-service";

function formatSessionMode(value: "online" | "in_person" | "both") {
  if (value === "online") {
    return "Online";
  }

  if (value === "in_person") {
    return "In person";
  }

  return "Both";
}

export default async function MyProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getOwnStudentProfile(session.user.id);

  if (!profile) {
    return (
      <section className="mx-auto w-full max-w-2xl space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-600">
          You have not created your student profile yet. Add it now so others can view your public page.
        </p>
        <Link
          href="/profile/edit"
          className="inline-block rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
        >
          Create Profile
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{profile.user.fullName}</h1>
          <p className="text-sm text-slate-600">@{profile.username}</p>
        </div>
        <Link
          href="/profile/edit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Edit Profile
        </Link>
      </div>

      {profile.avatarUrl ? (
        // Using a plain img keeps avatar setup simple without extra remote image config.
        <img
          src={profile.avatarUrl}
          alt={`${profile.user.fullName} avatar`}
          className="h-24 w-24 rounded-full border border-slate-200 object-cover"
        />
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">University</dt>
          <dd className="mt-1 text-sm text-slate-800">{profile.university}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Major</dt>
          <dd className="mt-1 text-sm text-slate-800">{profile.major}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</dt>
          <dd className="mt-1 text-sm text-slate-800">{profile.year}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</dt>
          <dd className="mt-1 text-sm text-slate-800">{profile.location}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Preferred session mode
          </dt>
          <dd className="mt-1 text-sm text-slate-800">
            {formatSessionMode(profile.preferredSessionMode)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{profile.bio}</dd>
        </div>
      </dl>

      <Link
        href={`/students/${profile.userId}`}
        className="inline-block rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
      >
        View Public Profile
      </Link>
    </section>
  );
}
