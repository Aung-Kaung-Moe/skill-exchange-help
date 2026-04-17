import { notFound } from "next/navigation";
import { getPublicStudentProfileByUserId } from "@/lib/profile/profile-service";

type PublicStudentPageProps = {
  params: Promise<{ id: string }>;
};

function formatSessionMode(value: "online" | "in_person" | "both") {
  if (value === "online") {
    return "Online";
  }

  if (value === "in_person") {
    return "In person";
  }

  return "Both";
}

export default async function PublicStudentPage({ params }: PublicStudentPageProps) {
  const { id } = await params;
  const profile = await getPublicStudentProfileByUserId(id);

  if (!profile) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{profile.user.fullName}</h1>
        <p className="text-sm text-slate-600">@{profile.username}</p>
      </div>

      {profile.avatarUrl ? (
        // Keeping avatar rendering straightforward; no extra image host config required.
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
    </section>
  );
}
