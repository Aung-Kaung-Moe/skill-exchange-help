import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ProfileForm, type ProfileFormValues } from "@/components/profile/profile-form";
import { authOptions } from "@/lib/auth/auth-options";
import { getOwnStudentProfile } from "@/lib/profile/profile-service";

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getOwnStudentProfile(session.user.id);

  const initialValues: ProfileFormValues = {
    username: profile?.username ?? "",
    university: profile?.university ?? "",
    major: profile?.major ?? "",
    year: profile?.year ? String(profile.year) : "",
    bio: profile?.bio ?? "",
    location: profile?.location ?? "",
    preferredSessionMode: profile?.preferredSessionMode ?? "both",
    avatarUrl: profile?.avatarUrl ?? ""
  };

  const isCreateMode = !profile;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isCreateMode ? "Create Your Profile" : "Edit Your Profile"}
        </h1>
        <p className="text-sm text-slate-600">
          Add your student details so peers can discover and connect with you.
        </p>
      </div>

      <ProfileForm initialValues={initialValues} />

      <Link href="/profile/me" className="inline-block text-sm font-medium">
        Back to my profile
      </Link>
    </section>
  );
}
