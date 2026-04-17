import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { SkillPostForm, type SkillPostFormValues } from "@/components/posts/post-form";
import { authOptions } from "@/lib/auth/auth-options";

const initialValues: SkillPostFormValues = {
  type: "offer",
  title: "",
  description: "",
  skillName: "",
  preferredMode: "both",
  status: "open"
};

export default async function NewPostPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Create Skill Post</h1>
        <p className="text-sm text-slate-600">Share a skill offer or a skill request with peers.</p>
      </div>

      <SkillPostForm mode="create" initialValues={initialValues} />
    </section>
  );
}
